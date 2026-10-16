import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { RefreshToken } from './../src/auth/refresh-token.entity.js';
import { Trainer } from './../src/trainers/trainer.entity.js';

// 실제 DB 필요: docker compose up -d && pnpm --filter api migration:run
const cookie = (res: request.Response, name: string) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${name}=`))?.split(';')[0];

describe('auth (e2e)', () => {
  let app: INestApplication<App>;
  let refreshTokens: Repository<RefreshToken>;
  const loginId = `e2e_${Date.now().toString(36)}`;
  let trainerId: string;

  // 폐기 시각을 1분 전으로 당겨 유예 시간(30초)이 지난 상황을 만듦
  const ageRevoked = () =>
    refreshTokens
      .createQueryBuilder()
      .update()
      .set({ revokedAt: () => "revoked_at - interval '1 minute'" })
      .where('trainer_id = :trainerId AND revoked_at IS NOT NULL', { trainerId })
      .execute();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    refreshTokens = app.get(getRepositoryToken(RefreshToken));
  });

  afterAll(async () => {
    await app.get<Repository<Trainer>>(getRepositoryToken(Trainer)).delete({ loginId });
    await app.close();
  });

  it('가입 → me → refresh 교체 → 옛 토큰 재사용 시 전체 로그아웃', async () => {
    const http = request(app.getHttpServer());
    const signup = await http
      .post('/api/auth/signup')
      .send({ loginId, email: `${loginId}@example.com`, password: 'password1234', name: '테스트' })
      .expect(201);
    trainerId = (signup.body as { id: string }).id;
    const access = cookie(signup, 'trainote_access')!;
    const refresh1 = cookie(signup, 'trainote_refresh')!;
    expect(access && refresh1).toBeTruthy();

    await http.get('/api/auth/me').set('Cookie', access).expect(200);

    // 교체: 새 리프레시 토큰 발급
    const rotated = await http.post('/api/auth/refresh').set('Cookie', refresh1).expect(204);
    const refresh2 = cookie(rotated, 'trainote_refresh')!;
    expect(refresh2).toBeTruthy();
    expect(refresh2).not.toBe(refresh1);

    // 유예 시간(30초) 내 옛 토큰 = 동시 요청으로 보고 액세스 토큰만 재발급
    const concurrent = await http.post('/api/auth/refresh').set('Cookie', refresh1).expect(204);
    expect(cookie(concurrent, 'trainote_access')).toBeTruthy();
    expect(cookie(concurrent, 'trainote_refresh')).toBeUndefined();

    // 유예 시간이 지난 옛 토큰 재사용 = 탈취 의심 → 새 토큰까지 모두 폐기
    await ageRevoked();
    await http.post('/api/auth/refresh').set('Cookie', refresh1).expect(401);
    await http.post('/api/auth/refresh').set('Cookie', refresh2).expect(401);
  });

  it('로그아웃한 리프레시 토큰은 다시 못 씀', async () => {
    const http = request(app.getHttpServer());
    const login = await http.post('/api/auth/login').send({ loginId, password: 'password1234' }).expect(200);
    const refresh = cookie(login, 'trainote_refresh')!;
    await http.post('/api/auth/logout').set('Cookie', refresh).expect(204);
    await ageRevoked();
    await http.post('/api/auth/refresh').set('Cookie', refresh).expect(401);
  });
});
