import { Body, Controller, Delete, Get, HttpCode, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { BodyService } from '../body/body.service.js';
import { BodyRecordDto } from '../body/dto.js';
import type { Member } from '../libs/database/entities/member.entity.js';
import { MemberSessionDto, MemberViewDto, MemberViewWorkoutDto, PushKeyDto } from './dto.js';
import { PushSubscriptionDto } from '../push/dto.js';
import { CurrentMember, MEMBER_COOKIE, MemberAuthGuard } from './member-auth.guard.js';
import { MEMBER_SESSION_DAYS, MemberViewService, PAGE_SIZE } from './member-view.service.js';
import { PushService } from '../push/push.service.js';
import { PushSubscriptionRepository } from '../libs/database/repositories/push-subscription.repository.js';

// 회원 토큰 쿠키는 회원 API 에만 전송
const memberCookie = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/api/v1/member',
});

// 회원용 API (/api/v1/member) — 가입 없이 코드 입력 → 회원 토큰(httpOnly 쿠키)으로 식별. 주소에 코드 없음
@ApiTags('member')
@Controller('member')
export class MemberViewController {
  constructor(
    private readonly memberViewService: MemberViewService,
    private readonly bodyService: BodyService,
    private readonly pushService: PushService,
    private readonly pushSubscriptionRepository: PushSubscriptionRepository,
  ) {}

  @Post('session')
  @HttpCode(204)
  // 코드 무작위 대입 방지: IP 당 1분 10회
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: '코드가 없거나 삭제된 회원' })
  async createSession(@Body() dto: MemberSessionDto, @Res({ passthrough: true }) res: Response) {
    const token = await this.memberViewService.createSession(dto.code);
    res.cookie(MEMBER_COOKIE, token, { ...memberCookie(), maxAge: MEMBER_SESSION_DAYS * 24 * 60 * 60 * 1000 });
  }

  @Delete('session')
  @HttpCode(204)
  @ApiNoContentResponse()
  deleteSession(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(MEMBER_COOKIE, memberCookie());
  }

  @Get('me')
  @UseGuards(MemberAuthGuard)
  @ApiQuery({ name: 'month', example: '2026-10', description: '이번 달(회원 기기 기준) — 월 운동 횟수 계산' })
  @ApiOkResponse({ type: MemberViewDto })
  @ApiUnauthorizedResponse()
  me(@CurrentMember() member: Member, @Query('month') month: string) {
    return this.memberViewService.profile(member, month);
  }

  @Get('me/workouts')
  @UseGuards(MemberAuthGuard)
  @ApiQuery({ name: 'before', required: false, example: '2026-10-17', description: '이 날짜 이전 기록 (무한 스크롤)' })
  @ApiOkResponse({ type: [MemberViewWorkoutDto], description: `최신순 최대 ${PAGE_SIZE}개` })
  @ApiUnauthorizedResponse()
  workouts(@CurrentMember() member: Member, @Query('before') before?: string) {
    return this.memberViewService.workouts(member, before);
  }

  @Get('me/body-records')
  @UseGuards(MemberAuthGuard)
  @ApiOkResponse({ type: [BodyRecordDto], description: '날짜 오름차순' })
  @ApiUnauthorizedResponse()
  bodyRecords(@CurrentMember() member: Member) {
    return this.bodyService.listByMemberId(member.id);
  }

  // 알림 받기 — 브라우저 구독에 필요한 공개 키
  @Get('push-key')
  @ApiOkResponse({ type: PushKeyDto })
  pushKey(): PushKeyDto {
    return { publicKey: this.pushService.publicKey };
  }

  // 이 기기 알림 구독 등록 (같은 기기면 덮어쓰기). 트레이너가 일지를 작성 완료하면 알림
  @Put('me/push-subscription')
  @UseGuards(MemberAuthGuard)
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse()
  async subscribePush(@CurrentMember() member: Member, @Body() { welcome, ...subscription }: PushSubscriptionDto) {
    await this.pushSubscriptionRepository.upsertByEndpoint({ memberId: member.id, ...subscription });
    if (welcome) {
      await this.pushService.sendToMemberDevice(subscription, {
        title: '알림이 켜졌어요',
        body: '트레이너가 운동일지를 작성하면 알려드려요',
        url: '/member/workouts',
      });
    }
  }
}
