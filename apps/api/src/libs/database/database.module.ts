import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions, entities } from './data-source.js';
import { BodyRecordRepository } from './repositories/body-record.repository.js';
import { ExerciseRepository } from './repositories/exercise.repository.js';
import { InquiryRepository } from './repositories/inquiry.repository.js';
import { MemberRepository } from './repositories/member.repository.js';
import { NoticeRepository } from './repositories/notice.repository.js';
import { PersonalWorkoutCommentRepository } from './repositories/personal-workout-comment.repository.js';
import { PersonalWorkoutRepository } from './repositories/personal-workout.repository.js';
import { PushSubscriptionRepository } from './repositories/push-subscription.repository.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { TrainerPushSubscriptionRepository } from './repositories/trainer-push-subscription.repository.js';
import { TrainerRepository } from './repositories/trainer.repository.js';
import { WorkoutLogRepository } from './repositories/workout-log.repository.js';

const repositories = [TrainerRepository, RefreshTokenRepository, MemberRepository, WorkoutLogRepository, BodyRecordRepository, InquiryRepository, ExerciseRepository, PushSubscriptionRepository, TrainerPushSubscriptionRepository, PersonalWorkoutRepository, PersonalWorkoutCommentRepository, NoticeRepository];

// DB 연결 + 엔티티별 Repository. Global — 도메인 모듈은 Repository 를 주입받기만 함
@Global()
@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), TypeOrmModule.forFeature(entities)],
  providers: repositories,
  exports: repositories,
})
export class DatabaseModule {}
