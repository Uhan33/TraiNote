import { join } from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Member } from '../members/member.entity.js';
import { Trainer } from '../trainers/trainer.entity.js';
import { WorkoutLog } from '../workouts/workout-log.entity.js';

// 앱과 TypeORM CLI(마이그레이션)가 함께 쓰는 설정
try {
  process.loadEnvFile();
} catch {
  // .env 없음 — 배포 환경은 실제 환경변수 사용
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // uuid 기본값을 Postgres 내장 gen_random_uuid() 로 (uuid-ossp 확장 불필요)
  uuidExtension: 'pgcrypto',
  entities: [Trainer, Member, WorkoutLog],
  // CLI 는 빌드 결과(dist)를 읽음 — 스크립트가 nest build 후 실행
  migrations: [join(import.meta.dirname, 'migrations/*.js')],
};

export default new DataSource(dataSourceOptions);
