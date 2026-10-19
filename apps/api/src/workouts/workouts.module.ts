import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module.js';
import { PushModule } from '../push/push.module.js';
import { WorkoutsController } from './workouts.controller.js';
import { WorkoutsService } from './workouts.service.js';

@Module({
  imports: [MembersModule, PushModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
})
export class WorkoutsModule {}
