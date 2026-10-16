import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

// main.ts 와 e2e 테스트가 같은 설정으로 앱을 띄우도록 공용화
export function setupApp(app: INestApplication) {
  // 배포 시 도메인.com/api 로 프록시 — 로컬과 경로를 맞춤
  app.setGlobalPrefix('api');
  // /api/v1/... — 호환이 깨지는 변경 때만 v2 추가. 인증(/api/auth)은 쿠키 경로 고정을 위해 버전 없음
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
