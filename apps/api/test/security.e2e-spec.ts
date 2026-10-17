import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { Trainer } from './../src/libs/database/entities/trainer.entity.js';

// 실제 DB 필요: docker compose up -d && pnpm --filter api migration:run
describe('회원 코드 전체 실패 제한 (e2e)', () => {
  let app: INestApplication<App>;
  const loginId = `sec_${Date.now().toString(36)}`;

  beforeAll(async () => {
    process.env.MEMBER_CODE_FAIL_LIMIT = '3'; // IP 당 제한(1분 10회)보다 낮게 — 전체 제한이 먼저 걸리게
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    delete process.env.MEMBER_CODE_FAIL_LIMIT;
    await app.get<Repository<Trainer>>(getRepositoryToken(Trainer)).delete({ loginId });
    await app.close();
  });

  it('틀린 코드가 기준 횟수에 닿으면 맞는 코드도 잠시 429', async () => {
    const trainer = request.agent(app.getHttpServer());
    await trainer.post('/api/auth/signup').send({ loginId, password: 'password1234', name: '홍길동' }).expect(201);
    const { body: member } = await trainer.post('/api/v1/members').send({ name: '김민지' }).expect(201);
    const http = request(app.getHttpServer());

    await http.post('/api/v1/member/session').send({ code: member.code }).expect(204); // 정상 입장
    for (const code of ['ZZZZZ1', 'ZZZZZ2', 'ZZZZZ3']) await http.post('/api/v1/member/session').send({ code }).expect(401);
    const locked = await http.post('/api/v1/member/session').send({ code: member.code }).expect(429);
    expect(locked.body.message).toBe('잠시 후 다시 시도해 주세요');
  });
});
