import { Body, Controller, Get, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { CreateInquiryDto, InquiryDto } from './dto.js';
import { InquiriesService } from './inquiries.service.js';

@ApiTags('inquiries')
@Controller('inquiries')
@UseGuards(AuthGuard)
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  // 내 문의 내역 (최신순, 답변 포함)
  @Get()
  @ApiOkResponse({ type: [InquiryDto] })
  list(@CurrentTrainerId() trainerId: string) {
    return this.inquiriesService.list(trainerId);
  }

  // 도배 방지: 1시간에 10건
  @Post()
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  @ApiNoContentResponse()
  create(@CurrentTrainerId() trainerId: string, @Body() dto: CreateInquiryDto, @Headers('user-agent') userAgent?: string) {
    return this.inquiriesService.create(trainerId, dto, userAgent);
  }
}
