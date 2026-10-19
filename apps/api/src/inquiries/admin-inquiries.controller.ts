import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
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

  @Put(':id/answer')
  @ApiOkResponse({ type: AdminInquiryDto })
  @ApiNotFoundResponse()
  answer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AnswerInquiryDto) {
    return this.inquiriesService.answer(id, dto.answer);
  }
}
