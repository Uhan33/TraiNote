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
describe('members · workouts (e2e)', () => {
  let app: INestApplication<App>;
  const suffix = Date.now().toString(36);
  const ids = [`wa_${suffix}`, `wb_${suffix}`, `wc_${suffix}`];

  // 가입하면 쿠키가 유지되는 agent
  const trainer = async (loginId: string) => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/signup').send({ loginId, password: 'password1234', name: loginId }).expect(201);
    return agent;
  };

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

  it('회원 추가 → 일지 저장·조회·지난 기록·날짜 목록 → 빈 일지 저장 시 삭제, 다른 트레이너는 접근 불가', async () => {
    const a = await trainer(ids[0]);
    const b = await trainer(ids[1]);

    await request(app.getHttpServer()).get('/api/v1/members').expect(401);

    const { body: member } = await a.post('/api/v1/members').send({ name: ' 김민지 ' }).expect(201);
    expect(member).toMatchObject({ name: '김민지', memo: '' });
    expect(member.code).toMatch(/^[A-Z0-9]{6}$/);
    expect((await a.get('/api/v1/members').expect(200)).body).toEqual([member]);

    const log = {
      title: '하체',
      memo: '',
      exercises: [{ name: '스쿼트', sets: [{ kg: 60, reps: 10, done: true }, { kg: null, reps: null, done: false }] }, { name: '레그 프레스', unit: 'lb', sets: [{ kg: 200, reps: 12, done: true }] }],
    };
    const url = `/api/v1/members/${member.code}/workouts`;
    await a.put(`${url}/2026-10-10`).send(log).expect(204);
    await a.put(`${url}/2026-10-10`).send({ ...log, title: '하체 2' }).expect(204); // 같은 날 = 덮어쓰기
    await a.put(`${url}/2026-10-12`).send(log).expect(204);

    const saved = (await a.get(`${url}/2026-10-10`).expect(200)).body;
    expect(saved).toMatchObject({ memberCode: member.code, date: '2026-10-10', title: '하체 2', exercises: log.exercises });
    // 코드는 소문자로 와도 같은 회원
    await a.get(`/api/v1/members/${member.code.toLowerCase()}/workouts/2026-10-10`).expect(200);

    expect((await a.get(`${url}/previous?before=2026-10-12`).expect(200)).body.date).toBe('2026-10-10');
    await a.get(`${url}/previous?before=2026-10-10`).expect(404);
    expect((await a.get(`${url}/dates`).expect(200)).body).toEqual(['2026-10-10', '2026-10-12']);
    expect((await a.get('/api/v1/workouts?date=2026-10-12').expect(200)).body).toHaveLength(1);

    // 직접 입력한 종목 — 기본 종목 제외, 최근 쓴 순, 트레이너별
    await a.get('/api/v1/exercises/custom').expect(200, []);
    await a.put(`${url}/2026-10-11`).send({ ...log, exercises: [{ name: '몬스터 글루트', sets: [] }] }).expect(204);
    await a.put(`${url}/2026-10-12`).send({ ...log, exercises: [...log.exercises, { name: '클램 쉘', sets: [] }] }).expect(204);
    await a.get('/api/v1/exercises/custom').expect(200, ['클램 쉘', '몬스터 글루트']);
    await b.get('/api/v1/exercises/custom').expect(200, []);
    await a.put(`${url}/2026-10-11`).send({ ...log, exercises: [] }).expect(204);

    // 운동이 비면 삭제
    await a.put(`${url}/2026-10-12`).send({ ...log, exercises: [] }).expect(204);
    await a.get(`${url}/2026-10-12`).expect(404);

    // 다른 트레이너: 회원이 존재하지 않는 것처럼 404, 목록에도 안 보임
    await b.get(`${url}/2026-10-10`).expect(404);
    await b.put(`${url}/2026-10-10`).send(log).expect(404);
    expect((await b.get('/api/v1/members').expect(200)).body).toEqual([]);
    expect((await b.get('/api/v1/workouts?date=2026-10-10').expect(200)).body).toEqual([]);

    // 다른 트레이너는 이름 수정·삭제도 불가
    await b.patch(`/api/v1/members/${member.code}`).send({ name: '해킹' }).expect(404);
    await b.delete(`/api/v1/members/${member.code}`).expect(404);

    // 이름·메모 수정
    const updated = (await a.patch(`/api/v1/members/${member.code}`).send({ name: '김민지2', memo: ' 오전반 ' }).expect(200)).body;
    expect(updated).toMatchObject({ name: '김민지2', memo: '오전반' });
    await a.patch(`/api/v1/members/${member.code}`).send({ name: '  ' }).expect(400);

    // 입력 검증
    await a.put(`${url}/2026-13-40`).send(log).expect(400);
    await a.put(`${url}/2026-02-31`).send(log).expect(400);
    await a.put(`${url}/2026-10-10`).send({ ...log, exercises: [{ name: '', sets: [] }] }).expect(400);
    await a.put(`${url}/2026-10-10`).send({ ...log, exercises: [{ name: 'x', sets: [{ kg: -1, reps: 1, done: true }] }] }).expect(400);
    await a.put(`${url}/2026-10-10`).send({ ...log, exercises: [{ name: 'x', unit: 'g', sets: [] }] }).expect(400);

    // 삭제(연결 해제) → 목록·일지·날짜에서 사라지고 접근 불가, 기록은 DB 에 보관
    await a.delete(`/api/v1/members/${member.code}`).expect(204);
    expect((await a.get('/api/v1/members').expect(200)).body).toEqual([]);
    expect((await a.get('/api/v1/workouts/dates').expect(200)).body).toEqual([]);
    await a.get(`${url}/2026-10-10`).expect(404);
  });

  it('남은 PT 횟수 — 지정 이후 새로 작성돼 작성 완료된 일지만 1회씩 차감, 수정은 그대로, 삭제하면 복구', async () => {
    const a = await trainer(ids[2]);
    const log = { title: '', memo: '', exercises: [{ name: '스쿼트', sets: [{ kg: 60, reps: 10, done: true }] }] };
    const { body: member } = await a.post('/api/v1/members').send({ name: '김민지' }).expect(201);
    expect(member.ptRemaining).toBeNull();
    const url = `/api/v1/members/${member.code}`;
    const remaining = async () => (await a.get('/api/v1/members').expect(200)).body[0].ptRemaining;

    await a.put(`${url}/workouts/2026-10-01`).send(log).expect(204); // 지정 전 일지 — 차감 안 함
    expect((await a.put(`${url}/pt`).send({ remaining: 10 }).expect(200)).body.ptRemaining).toBe(10);
    await a.put(`${url}/workouts/2026-10-02`).send(log).expect(204);
    await a.put(`${url}/workouts/2026-10-02`).send({ ...log, title: '수정' }).expect(204);
    await a.put(`${url}/workouts/2026-10-01`).send({ ...log, title: '수정' }).expect(204);
    expect(await remaining()).toBe(10); // 작성 완료 전 — 차감 안 함
    await a.post(`${url}/workouts/2026-10-02/complete`).expect(204);
    await a.post(`${url}/workouts/2026-10-02/complete`).expect(204);
    expect(await remaining()).toBe(9);

    await a.put(`${url}/workouts/2026-10-02`).send({ ...log, exercises: [] }).expect(204);
    expect(await remaining()).toBe(10);

    await a.put(`${url}/pt`).send({ remaining: -1 }).expect(400);
    expect((await a.put(`${url}/pt`).send({ remaining: null }).expect(200)).body.ptRemaining).toBeNull();
  });
});
