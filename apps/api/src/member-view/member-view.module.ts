import { Module } from '@nestjs/common';
import { BodyModule } from '../body/body.module.js';
import { MembersModule } from '../members/members.module.js';
import { PersonalWorkoutsModule } from '../personal-workouts/personal-workouts.module.js';
import { PushModule } from '../push/push.module.js';
import { MemberAuthGuard } from './member-auth.guard.js';
import { MemberViewController } from './member-view.controller.js';
import { MemberViewService } from './member-view.service.js';

@Module({
  imports: [MembersModule, BodyModule, PushModule, PersonalWorkoutsModule],
  controllers: [MemberViewController],
  providers: [MemberViewService, MemberAuthGuard],
})
export class MemberViewModule {}
