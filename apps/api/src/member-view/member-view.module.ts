import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyModule } from '../body/body.module.js';
import { Member } from '../members/member.entity.js';
import { WorkoutLog } from '../workouts/workout-log.entity.js';
import { MemberAuthGuard } from './member-auth.guard.js';
import { MemberViewController } from './member-view.controller.js';
import { MemberViewService } from './member-view.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Member, WorkoutLog]), BodyModule],
  controllers: [MemberViewController],
  providers: [MemberViewService, MemberAuthGuard],
})
export class MemberViewModule {}
