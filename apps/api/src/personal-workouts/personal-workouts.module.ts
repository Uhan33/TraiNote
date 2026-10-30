import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module.js';
import { PushModule } from '../push/push.module.js';
import { PersonalWorkoutsController } from './personal-workouts.controller.js';
import { PersonalWorkoutsService } from './personal-workouts.service.js';

@Module({
  imports: [MembersModule, PushModule],
  controllers: [PersonalWorkoutsController],
  providers: [PersonalWorkoutsService],
  exports: [PersonalWorkoutsService],
})
export class PersonalWorkoutsModule {}
