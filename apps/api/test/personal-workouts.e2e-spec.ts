import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { In, Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { Trainer } from './../src/libs/database/entities/trainer.entity.js';

// 실제 DB 필요: docker compose up -d && pnpm --filter api migration:run
describe('personal workouts (e2e)', () => {
  let app: INestApplication<App>;
  const suffix = Date.now().toString(36);
  const ids = [`pa_${suffix}`, `pb_${suffix}`];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.get<Repository<Trainer>>(getRepositoryToken(Trainer)).delete({ loginId: In(ids) });
    await app.close();
  });

  it('회원 작성(하루 1건 덮어쓰기)·삭제, 회원·트레이너 댓글, 본인 댓글만 삭제, 다른 트레이너 차단', async () => {
    const a = request.agent(app.getHttpServer());
    const b = request.agent(app.getHttpServer());
    await a.post('/api/auth/signup').send({ loginId: ids[0], password: 'password1234', name: 'A' }).expect(201);
    await b.post('/api/auth/signup').send({ loginId: ids[1], password: 'password1234', name: 'B' }).expect(201);
    const { body: member } = await a.post('/api/v1/members').send({ name: '김민지' }).expect(201);
    const m = request.agent(app.getHttpServer());
    await m.post('/api/v1/member/session').send({ code: member.code }).expect(204);

    const mine = '/api/v1/member/me/personal-workouts';
    const trainerUrl = `/api/v1/members/${member.code}/personal-workouts`;
    const squat = { name: '스쿼트', sets: [] };

    await m.put(`${mine}/2026-10-29`).send({ content: '  ', exercises: [] }).expect(400);
    await m.put(`${mine}/2026-10-29`).send({ content: '가볍게', exercises: [] }).expect(204);
    await m.put(`${mine}/2026-10-29`).send({ content: '가볍게 하체', exercises: [squat, { name: '몬스터 워크', sets: [] }] }).expect(204); // 덮어쓰기
    await m.put(`${mine}/2026-10-30`).send({ content: '', exercises: [squat] }).expect(204);

    // 댓글 — 트레이너·회원
    const { body: tc } = await a.post(`${trainerUrl}/2026-10-29/comments`).send({ content: ' 자세 좋네요 ' }).expect(201);
    const { body: mc } = await m.post(`${mine}/2026-10-29/comments`).send({ content: '감사합니다' }).expect(201);
    await a.post(`${trainerUrl}/2026-10-01/comments`).send({ content: 'x' }).expect(404);
    await m.post(`${mine}/2026-10-29/comments`).send({ content: '' }).expect(400);

    const list = (await a.get(trainerUrl).expect(200)).body;
    expect(list).toMatchObject([
      { date: '2026-10-30', content: '', exercises: [squat], comments: [] },
      { date: '2026-10-29', content: '가볍게 하체', comments: [{ author: 'trainer', content: '자세 좋네요' }, { author: 'member', content: '감사합니다' }] },
    ]);
    expect((await m.get(mine).expect(200)).body).toEqual(list);
    expect((await m.get(`${mine}?before=2026-10-30`).expect(200)).body).toHaveLength(1);

    // 직접 입력한 종목 — 개인운동에서 회원이 입력한 것만 (트레이너가 PT 일지에 입력한 종목은 제외)
    await a.put(`/api/v1/members/${member.code}/workouts/2026-10-20`).send({ title: '', memo: '', exercises: [{ name: '트레이너 직접 입력', sets: [] }] }).expect(204);
    await a.post(`/api/v1/members/${member.code}/workouts/2026-10-20/complete`).expect(204);
    expect((await m.get('/api/v1/member/me/exercises/custom').expect(200)).body).toEqual(['몬스터 워크']);
    expect((await m.get('/api/v1/member/exercises').expect(200)).body.length).toBeGreaterThan(0);

    // 안 읽음 — 새 기록 2개 → 열어 보면 해제, 회원이 댓글 달거나 수정하면 다시 안 읽음
    const unread = async () => (await a.get('/api/v1/personal-workouts/unread').expect(200)).body;
    expect(await unread()).toEqual([{ memberCode: member.code, count: 2 }]);
    expect(list.map((w: { unread: boolean }) => w.unread)).toEqual([true, true]);
    await a.post(`${trainerUrl}/2026-10-29/read`).expect(204);
    await a.post(`${trainerUrl}/2026-10-30/read`).expect(204);
    expect(await unread()).toEqual([]);
    await m.post(`${mine}/2026-10-29/comments`).send({ content: '질문 있어요' }).expect(201);
    await a.post(`${trainerUrl}/2026-10-30/comments`).send({ content: '트레이너 댓글은 안 읽음 아님' }).expect(201);
    expect(await unread()).toEqual([{ memberCode: member.code, count: 1 }]);
    expect((await b.get('/api/v1/personal-workouts/unread').expect(200)).body).toEqual([]);
    await b.post(`${trainerUrl}/2026-10-29/read`).expect(404);

    // 본인 댓글만 삭제
    await m.delete(`${mine}/2026-10-29/comments/${tc.id}`).expect(404);
    await a.delete(`${trainerUrl}/2026-10-29/comments/${mc.id}`).expect(404);
    await a.delete(`${trainerUrl}/2026-10-29/comments/${tc.id}`).expect(204);
    await m.delete(`${mine}/2026-10-29/comments/${mc.id}`).expect(204);

    // 다른 트레이너
    await b.get(trainerUrl).expect(404);
    await b.post(`${trainerUrl}/2026-10-29/comments`).send({ content: 'x' }).expect(404);

    // 공지사항 — 트레이너·회원 각자 글 (마이그레이션에 넣은 첫 공지)
    const trainerNotices = (await a.get('/api/v1/notices').expect(200)).body;
    const memberNotices = (await m.get('/api/v1/member/notices').expect(200)).body;
    expect(trainerNotices.map((n: { title: string }) => n.title)).toContain('개인운동 기능이 추가됐어요');
    expect(memberNotices[0].body).not.toBe(trainerNotices[0].body);
    await request(app.getHttpServer()).get('/api/v1/member/notices').expect(401);
    // 읽음은 계정별 — 트레이너가 읽어도 회원은 안 읽음
    expect(trainerNotices.every((n: { read: boolean }) => !n.read)).toBe(true);
    await a.post(`/api/v1/notices/${trainerNotices[0].id}/read`).expect(204);
    await a.post(`/api/v1/notices/${trainerNotices[0].id}/read`).expect(204);
    expect((await a.get('/api/v1/notices').expect(200)).body[0].read).toBe(true);
    expect((await b.get('/api/v1/notices').expect(200)).body[0].read).toBe(false);
    expect((await m.get('/api/v1/member/notices').expect(200)).body[0].read).toBe(false);
    await m.post(`/api/v1/member/notices/${memberNotices[0].id}/read`).expect(204);
    expect((await m.get('/api/v1/member/notices').expect(200)).body[0].read).toBe(true);
    await a.post('/api/v1/notices/00000000-0000-4000-8000-000000000000/read').expect(404);

    // 삭제
    await m.delete(`${mine}/2026-10-30`).expect(204);
    expect((await m.get(mine).expect(200)).body.map((w: { date: string }) => w.date)).toEqual(['2026-10-29']);
    await request(app.getHttpServer()).get(mine).expect(401);
  });
});
