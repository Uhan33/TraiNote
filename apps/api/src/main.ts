import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 배포 시 앞단 프록시(Caddy) 1단 뒤 — 요청 IP 를 X-Forwarded-For 에서 읽음 (요청 횟수 제한이 사용자 IP 기준으로 동작)
  app.set('trust proxy', 1);
  setupApp(app);
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173', credentials: true });

  const config = new DocumentBuilder().setTitle('TraiNote API').setVersion(releaseVersion()).build();
  // /docs: Swagger UI, /docs-json: OpenAPI 스펙 (web 의 orval 이 읽음)
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config, {
      // orval 함수명: WorkoutsController.get → workoutsGet → useWorkoutsGet
      operationIdFactory: (controller, method) =>
        controller.replace(/Controller$/, '').replace(/^./, (c) => c.toLowerCase()) + method[0].toUpperCase() + method.slice(1),
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}
// 릴리즈 버전은 루트 package.json 하나가 기준
function releaseVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '../../../package.json'), 'utf8')) as { version: string };
    return pkg.version;
  } catch {
    return 'dev';
  }
}

await bootstrap();
