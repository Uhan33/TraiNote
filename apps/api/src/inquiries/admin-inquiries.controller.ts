import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { PushSubscriptionDto } from '../push/dto.js';
import { AdminInquiryDto, AnswerInquiryDto } from './dto.js';
import { InquiriesService } from './inquiries.service.js';

// 운영자 문의 관리 — trainer.role = admin 만
@ApiTags('admin')
@Controller('admin/inquiries')
@UseGuards(AuthGuard, AdminGuard)
@ApiForbiddenResponse({ description: '운영자 아님' })
export class AdminInquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @ApiOkResponse({ type: [AdminInquiryDto], description: '전체 문의 최신순' })
  list() {
    return this.inquiriesService.listAll();
  }

  // 이 기기로 새 문의 알림 받기 (같은 기기면 덮어쓰기). 공개 키는 GET /member/push-key
  @Put('push-subscription')
  @HttpCode(204)
  @ApiNoContentResponse()
  subscribePush(@CurrentTrainerId() trainerId: string, @Body() dto: PushSubscriptionDto) {
    return this.inquiriesService.subscribeAdminPush(trainerId, dto);
  }

  @Put(':id/answer')
  @ApiOkResponse({ type: AdminInquiryDto })
  @ApiNotFoundResponse()
  answer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AnswerInquiryDto) {
    return this.inquiriesService.answer(id, dto.answer);
  }
}
