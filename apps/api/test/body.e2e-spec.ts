import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { In, Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { Trainer } from './../src/trainers/trainer.entity.js';

// 실제 DB 필요: docker compose up -d && pnpm --filter api migration:run
describe('body records (e2e)', () => {
  let app: INestApplication<App>;
  const suffix = Date.now().toString(36);
  const ids = [`ba_${suffix}`, `bb_${suffix}`];

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

  it('체중 저장(같은 날 덮어쓰기)·삭제, 날짜순 조회, 다른 트레이너 차단, 회원 본인 조회', async () => {
    const a = request.agent(app.getHttpServer());
    const b = request.agent(app.getHttpServer());
    await a.post('/api/auth/signup').send({ loginId: ids[0], password: 'password1234', name: 'A' }).expect(201);
    await b.post('/api/auth/signup').send({ loginId: ids[1], password: 'password1234', name: 'B' }).expect(201);
    const { body: member } = await a.post('/api/v1/members').send({ name: '김민지' }).expect(201);
    const url = `/api/v1/members/${member.code}/body-records`;

    await a.put(`${url}/2026-10-10`).send({ weightKg: 72.4 }).expect(204);
    await a.put(`${url}/2026-10-01`).send({ weightKg: 73.15 }).expect(204);
    await a.put(`${url}/2026-10-10`).send({ weightKg: 72.1, bodyFatPct: 22.4, skeletalMuscleKg: 28.35 }).expect(204); // 덮어쓰기 + 인바디 항목
    await a.put(`${url}/2026-10-12`).send({ weightKg: 71.8 }).expect(204);
    await a.delete(`${url}/2026-10-12`).expect(204);

    expect((await a.get(url).expect(200)).body).toEqual([
      { date: '2026-10-01', weightKg: 73.15, bodyFatPct: null, skeletalMuscleKg: null },
      { date: '2026-10-10', weightKg: 72.1, bodyFatPct: 22.4, skeletalMuscleKg: 28.35 },
    ]);

    await a.put(`${url}/2026-10-11`).send({ weightKg: 5 }).expect(400);
    await a.put(`${url}/2026-10-11`).send({ weightKg: '72' }).expect(400);
    await a.put(`${url}/2026-02-31`).send({ weightKg: 72 }).expect(400);
    await a.put(`${url}/2026-10-11`).send({ weightKg: 72, bodyFatPct: 90 }).expect(400);
    await a.put(`${url}/2026-10-11`).send({ weightKg: 72, skeletalMuscleKg: 2 }).expect(400);

    await b.get(url).expect(404);
    await b.put(`${url}/2026-10-11`).send({ weightKg: 70 }).expect(404);
    await b.delete(`${url}/2026-10-10`).expect(404);

    const memberAgent = request.agent(app.getHttpServer());
    await memberAgent.get('/api/v1/member/me/body-records').expect(401);
    await memberAgent.post('/api/v1/member/session').send({ code: member.code }).expect(204);
    expect((await memberAgent.get('/api/v1/member/me/body-records').expect(200)).body).toHaveLength(2);
  });
});
