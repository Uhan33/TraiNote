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
const cookie = (res: request.Response, name: string) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${name}=`))?.split(';')[0];

describe('auth (e2e)', () => {
  let app: INestApplication<App>;
  const loginId = `e2e_${Date.now().toString(36)}`;

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

  it('가입 → me → refresh 는 같은 토큰 유지 → 모든 기기에서 로그아웃', async () => {
    const http = request(app.getHttpServer());
    const signup = await http
      .post('/api/auth/signup')
      // role 을 보내도 무시 — 운영자 권한은 DB 에서만 지정
      .send({ loginId, email: `${loginId}@example.com`, password: 'password1234', name: '테스트', role: 'admin' })
      .expect(201);
    expect(signup.body).toMatchObject({ role: 'trainer' });
    const access = cookie(signup, 'trainote_access')!;
    const refresh = cookie(signup, 'trainote_refresh')!;
    expect(access && refresh).toBeTruthy();

    expect((await http.get('/api/auth/me').set('Cookie', access).expect(200)).body).toMatchObject({ role: 'trainer' });

    // 갱신해도 리프레시 토큰은 그대로(만료만 연장) — 같은 토큰을 가진 다른 곳(iOS 홈 화면 앱)도 계속 사용
    const refreshed = await http.post('/api/auth/refresh').set('Cookie', refresh).expect(204);
    expect(cookie(refreshed, 'trainote_access')).toBeTruthy();
    expect(cookie(refreshed, 'trainote_refresh')).toBe(refresh);
    await http.post('/api/auth/refresh').set('Cookie', refresh).expect(204);

    // 다른 기기 로그인 → 모든 기기에서 로그아웃 → 두 토큰 다 폐기
    const other = cookie(await http.post('/api/auth/login').send({ loginId, password: 'password1234' }).expect(200), 'trainote_refresh')!;
    await http.post('/api/auth/logout-all').set('Cookie', cookie(refreshed, 'trainote_access')!).expect(204);
    await http.post('/api/auth/refresh').set('Cookie', refresh).expect(401);
    await http.post('/api/auth/refresh').set('Cookie', other).expect(401);
  });

  it('로그아웃한 리프레시 토큰은 다시 못 씀', async () => {
    const http = request(app.getHttpServer());
    const login = await http.post('/api/auth/login').send({ loginId, password: 'password1234' }).expect(200);
    const refresh = cookie(login, 'trainote_refresh')!;
    await http.post('/api/auth/logout').set('Cookie', refresh).expect(204);
    await http.post('/api/auth/refresh').set('Cookie', refresh).expect(401);
  });
});
