import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { In, Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { Inquiry } from './../src/libs/database/entities/inquiry.entity.js';
import { Trainer } from './../src/libs/database/entities/trainer.entity.js';
import { TrainerPushSubscriptionRepository } from './../src/libs/database/repositories/trainer-push-subscription.repository.js';

// 실제 DB 필요: docker compose up -d && pnpm --filter api migration:run
describe('inquiries (e2e)', () => {
  let app: INestApplication<App>;
  const loginId = `iq_${Date.now().toString(36)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.get<Repository<Trainer>>(getRepositoryToken(Trainer)).delete({ loginId: In([loginId, `${loginId}b`]) });
    await app.close();
  });

  it('로그인한 트레이너만 문의 등록, 유형·제목·내용 검증, 기기 정보 함께 저장', async () => {
    const inquiry = { category: 'bug', title: ' 회원 추가 오류 ', content: '추가 버튼이 안 눌려요', appVersion: '0.1.0' };
    await request(app.getHttpServer()).post('/api/v1/inquiries').send(inquiry).expect(401);

    const trainer = request.agent(app.getHttpServer());
    const { body: me } = await trainer.post('/api/auth/signup').send({ loginId, password: 'password1234', name: '홍길동' }).expect(201);

    await trainer.post('/api/v1/inquiries').send({ ...inquiry, category: 'spam' }).expect(400);
    await trainer.post('/api/v1/inquiries').send({ ...inquiry, title: '  ' }).expect(400);
    await trainer.post('/api/v1/inquiries').send({ ...inquiry, content: 'x'.repeat(2001) }).expect(400);
    await trainer.post('/api/v1/inquiries').set('User-Agent', 'test-phone').send(inquiry).expect(204);

    const saved = await app.get<Repository<Inquiry>>(getRepositoryToken(Inquiry)).findBy({ trainerId: me.id });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ category: 'bug', title: '회원 추가 오류', contact: '', userAgent: 'test-phone', appVersion: '0.1.0' });

    // 문의 내역: 답변 전엔 answer null, 운영자 답변(DB 수정) 후 표시. 기기 정보·연락처는 응답에 없음
    const before = (await trainer.get('/api/v1/inquiries').expect(200)).body;
    expect(before).toEqual([expect.objectContaining({ id: saved[0].id, title: '회원 추가 오류', answer: null, answeredAt: null })]);
    expect(before[0]).not.toHaveProperty('userAgent');
    await app.get<Repository<Inquiry>>(getRepositoryToken(Inquiry)).update({ id: saved[0].id }, { answer: '고쳤어요', answeredAt: new Date() });
    const after = (await trainer.get('/api/v1/inquiries').expect(200)).body;
    expect(after[0]).toMatchObject({ answer: '고쳤어요', answeredAt: expect.any(String) });

    // 운영자 문의 관리: 일반 트레이너 403 → DB 에서 admin 지정 후 전체 조회·답변·수정
    await trainer.get('/api/v1/admin/inquiries').expect(403);
    await trainer.put(`/api/v1/admin/inquiries/${saved[0].id}/answer`).send({ answer: '몰래 답변' }).expect(403);
    const device = {
      endpoint: `https://web.push.apple.com/${loginId}`,
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    };
    // 트레이너 기기 알림 구독 (문의 답변 알림) — 로그인 필요, 알려진 푸시 서비스 주소만
    await request(app.getHttpServer()).put('/api/v1/push-subscription').send(device).expect(401);
    await trainer.put('/api/v1/push-subscription').send({ ...device, endpoint: 'http://api:4000/x' }).expect(400);
    await trainer.put('/api/v1/push-subscription').send(device).expect(204);
    const trainers = app.get<Repository<Trainer>>(getRepositoryToken(Trainer));
    await trainers.update({ id: me.id }, { role: 'admin' });

    // 새 문의 알림은 지금 운영자인 트레이너 기기만
    const adminDevices = () => app.get(TrainerPushSubscriptionRepository).listAdmins();
    expect((await adminDevices()).map((d) => d.endpoint)).toContain(device.endpoint);
    await trainers.update({ id: me.id }, { role: 'trainer' });
    expect((await adminDevices()).map((d) => d.endpoint)).not.toContain(device.endpoint);
    await trainers.update({ id: me.id }, { role: 'admin' });
    const all = (await trainer.get('/api/v1/admin/inquiries').expect(200)).body;
    expect(all.find((i: { id: string }) => i.id === saved[0].id)).toMatchObject({ trainerLoginId: loginId, trainerName: '홍길동', userAgent: 'test-phone' });
    await trainer.put(`/api/v1/admin/inquiries/${saved[0].id}/answer`).send({ answer: '  ' }).expect(400);
    await trainer.put('/api/v1/admin/inquiries/not-a-uuid/answer').send({ answer: '답변' }).expect(400);
    const edited = (await trainer.put(`/api/v1/admin/inquiries/${saved[0].id}/answer`).send({ answer: ' 다시 고쳤어요 ' }).expect(200)).body;
    expect(edited).toMatchObject({ answer: '다시 고쳤어요', answeredAt: expect.any(String) });
    expect((await trainer.get('/api/v1/inquiries').expect(200)).body[0]).toMatchObject({ answer: '다시 고쳤어요' });

    // 다른 트레이너의 문의는 안 보임
    const other = request.agent(app.getHttpServer());
    await other.post('/api/auth/signup').send({ loginId: `${loginId}b`, password: 'password1234', name: '김철수' }).expect(201);
    expect((await other.get('/api/v1/inquiries').expect(200)).body).toEqual([]);
  });
});
