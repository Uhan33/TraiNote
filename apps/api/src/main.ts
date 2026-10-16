import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173', credentials: true });

  const config = new DocumentBuilder().setTitle('TraiNote API').setVersion(releaseVersion()).build();
  // /docs: Swagger UI, /docs-json: OpenAPI 스펙 (web 의 orval 이 읽음)
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));

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
