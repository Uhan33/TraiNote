import { Module } from '@nestjs/common';
import { PushModule } from '../push/push.module.js';
import { AdminInquiriesController } from './admin-inquiries.controller.js';
import { InquiriesController } from './inquiries.controller.js';
import { InquiriesService } from './inquiries.service.js';

@Module({
  imports: [PushModule],
  controllers: [InquiriesController, AdminInquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
