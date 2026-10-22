import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { PushSubscription } from './../src/libs/database/entities/push-subscription.entity.js';
import { Trainer } from './../src/libs/database/entities/trainer.entity.js';

// 실제 DB 필요: docker compose up -d && pnpm --filter api migration:run
const cookie = (res: request.Response, name: string) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${name}=`))?.split(';')[0];

describe('member view (e2e)', () => {
  let app: INestApplication<App>;
  const loginId = `mv_${Date.now().toString(36)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.get<Repository<Trainer>>(getRepositoryToken(Trainer)).delete({ loginId });
    await app.close();
  });

  it('코드 입력 → 회원 토큰으로 조회, 완료된 일지만 공개, 메모 비노출, 10개씩 페이지, 재발급·삭제 시 토큰·알림 구독 무효, 토큰 교차 사용 차단', async () => {
    const trainer = request.agent(app.getHttpServer());
    const signup = await trainer.post('/api/auth/signup').send({ loginId, password: 'password1234', name: '홍길동' }).expect(201);
    const trainerAccess = cookie(signup, 'trainote_access')!;
    const { body: member } = await trainer.post('/api/v1/members').send({ name: '김민지', memo: '비밀 메모' }).expect(201);

    for (let d = 1; d <= 12; d++) {
      const date = `2026-10-${String(d).padStart(2, '0')}`;
      await trainer
        .put(`/api/v1/members/${member.code}/workouts/${date}`)
        .send({ title: `${d}일`, memo: '코멘트', exercises: [{ name: '스쿼트', sets: [{ kg: 60, reps: 10, done: true }] }] })
        .expect(204);
      // 12일은 작성 중으로 남김 — 회원에게 안 보여야 함
      if (d < 12) await trainer.post(`/api/v1/members/${member.code}/workouts/${date}/complete`).expect(204);
    }
    // 이미 완료한 일지 다시 완료해도 그대로, 없는 일지는 404
    await trainer.post(`/api/v1/members/${member.code}/workouts/2026-10-01/complete`).expect(204);
    await trainer.post(`/api/v1/members/${member.code}/workouts/2026-10-20/complete`).expect(404);
    const { body: logs } = await trainer.get('/api/v1/workouts?date=2026-10-12').expect(200);
    expect(logs[0].completedAt).toBeNull();
    // 작성 완료 전 일지 목록 — 12일만
    const { body: drafts } = await trainer.get('/api/v1/workouts/drafts').expect(200);
    expect(drafts.map((l: { date: string }) => l.date)).toEqual(['2026-10-12']);

    const http = request(app.getHttpServer());
    await http.get('/api/v1/member/me?month=2026-10').expect(401);
    await http.post('/api/v1/member/session').send({ code: 'ZZZZZZ' }).expect(401);
    await http.post('/api/v1/member/session').send({ code: '12' }).expect(400);

    // 소문자로 입력해도 됨
    const session = await http.post('/api/v1/member/session').send({ code: member.code.toLowerCase() }).expect(204);
    const memberToken = cookie(session, 'trainote_member')!;
    expect(memberToken).toBeTruthy();

    const profile = (await http.get('/api/v1/member/me?month=2026-10').set('Cookie', memberToken).expect(200)).body;
    expect(profile).toEqual({ name: '김민지', trainerName: '홍길동', monthCount: 11, totalCount: 11, ptRemaining: null });
    expect(JSON.stringify(profile)).not.toContain('비밀 메모');

    const page1 = (await http.get('/api/v1/member/me/workouts').set('Cookie', memberToken).expect(200)).body;
    expect(page1).toHaveLength(10);
    expect(page1[0]).toEqual({ date: '2026-10-11', title: '11일', memo: '코멘트', exercises: [{ name: '스쿼트', sets: [{ kg: 60, reps: 10, done: true }] }] });
    const page2 = (await http.get(`/api/v1/member/me/workouts?before=${page1.at(-1).date}`).set('Cookie', memberToken).expect(200)).body;
    expect(page2.map((l: { date: string }) => l.date)).toEqual(['2026-10-01']);

    // 성장 그래프 — 완료된 일지만 (12일 작성 중 제외)
    const strength = (await http.get('/api/v1/member/me/strength').set('Cookie', memberToken).expect(200)).body;
    expect(strength).toHaveLength(1);
    expect(strength[0]).toMatchObject({ name: '스쿼트', bodyPart: '하체' });
    expect(strength[0].points).toHaveLength(11);
    expect((await trainer.get(`/api/v1/members/${member.code}/strength`).expect(200)).body).toEqual(strength);

    // 알림 구독: 알려진 푸시 서비스 주소만
    const keys = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' };
    await http.put('/api/v1/member/me/push-subscription').set('Cookie', memberToken).send({ endpoint: 'http://api:4000/x', ...keys }).expect(400);
    await http.put('/api/v1/member/me/push-subscription').set('Cookie', memberToken).send({ endpoint: 'https://fcm.googleapis.com.evil.com/x', ...keys }).expect(400);
    const endpoint = `https://web.push.apple.com/${loginId}`;
    await http.put('/api/v1/member/me/push-subscription').set('Cookie', memberToken).send({ endpoint, ...keys }).expect(204);
    await http.put('/api/v1/member/me/push-subscription').set('Cookie', memberToken).send({ endpoint, ...keys }).expect(204);
    const subscriptions = app.get<Repository<PushSubscription>>(getRepositoryToken(PushSubscription));
    expect(await subscriptions.countBy({ endpoint })).toBe(1);

    // 토큰 교차 사용 차단: 회원 토큰을 트레이너 쿠키 자리에, 트레이너 토큰을 회원 쿠키 자리에
    await http.get('/api/auth/me').set('Cookie', `trainote_access=${memberToken.split('=')[1]}`).expect(401);
    await http.get('/api/v1/member/me?month=2026-10').set('Cookie', `trainote_member=${trainerAccess.split('=')[1]}`).expect(401);

    // 코드 재발급 → 기존 토큰·기존 코드 무효, 새 코드로 재입장
    const { body: reissued } = await trainer.post(`/api/v1/members/${member.code}/reissue`).expect(201);
    expect(reissued.code).not.toBe(member.code);
    await http.get('/api/v1/member/me?month=2026-10').set('Cookie', memberToken).expect(401);
    await http.post('/api/v1/member/session').send({ code: member.code }).expect(401);
    const again = cookie(await http.post('/api/v1/member/session').send({ code: reissued.code }).expect(204), 'trainote_member')!;
    // 기록은 그대로
    expect((await http.get('/api/v1/member/me?month=2026-10').set('Cookie', again).expect(200)).body.totalCount).toBe(11);
    // 예전 기기 알림 구독 삭제
    expect(await subscriptions.countBy({ endpoint })).toBe(0);

    // 삭제(연결 해제) → 토큰 무효
    await trainer.delete(`/api/v1/members/${reissued.code}`).expect(204);
    await http.get('/api/v1/member/me?month=2026-10').set('Cookie', again).expect(401);
  });
});
