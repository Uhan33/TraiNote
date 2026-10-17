import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module.js';
import { BodyController } from './body.controller.js';
import { BodyService } from './body.service.js';

@Module({
  imports: [MembersModule],
  controllers: [BodyController],
  providers: [BodyService],
  exports: [BodyService],
})
export class BodyModule {}
