import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '../members/members.module.js';
import { BodyRecord } from './body-record.entity.js';
import { BodyController } from './body.controller.js';
import { BodyService } from './body.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([BodyRecord]), MembersModule],
  controllers: [BodyController],
  providers: [BodyService],
  exports: [BodyService],
})
export class BodyModule {}
