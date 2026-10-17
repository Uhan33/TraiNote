import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { Inquiry } from './../src/libs/database/entities/inquiry.entity.js';
import { Trainer } from './../src/libs/database/entities/trainer.entity.js';

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
    await app.get<Repository<Trainer>>(getRepositoryToken(Trainer)).delete({ loginId });
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
  });
});
