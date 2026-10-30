import { join } from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { BodyRecord } from './entities/body-record.entity.js';
import { Exercise } from './entities/exercise.entity.js';
import { Inquiry } from './entities/inquiry.entity.js';
import { Member } from './entities/member.entity.js';
import { NoticeRead } from './entities/notice-read.entity.js';
import { Notice } from './entities/notice.entity.js';
import { PersonalWorkoutComment } from './entities/personal-workout-comment.entity.js';
import { PersonalWorkout } from './entities/personal-workout.entity.js';
import { PushSubscription } from './entities/push-subscription.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { TrainerPushSubscription } from './entities/trainer-push-subscription.entity.js';
import { Trainer } from './entities/trainer.entity.js';
import { WorkoutLog } from './entities/workout-log.entity.js';

// 앱(DatabaseModule)과 TypeORM CLI(마이그레이션)가 함께 쓰는 설정
try {
  process.loadEnvFile();
} catch {
  // .env 없음 — 배포 환경은 실제 환경변수 사용
}

export const entities = [Trainer, RefreshToken, Member, WorkoutLog, BodyRecord, Inquiry, Exercise, PushSubscription, TrainerPushSubscription, PersonalWorkout, PersonalWorkoutComment, Notice, NoticeRead];

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // uuid 기본값을 Postgres 내장 gen_random_uuid() 로 (uuid-ossp 확장 불필요)
  uuidExtension: 'pgcrypto',
  entities,
  // CLI 는 빌드 결과(dist)를 읽음 — 스크립트가 nest build 후 실행
  migrations: [join(import.meta.dirname, 'migrations/*.js')],
};

export default new DataSource(dataSourceOptions);
