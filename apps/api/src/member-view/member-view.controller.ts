import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { BodyService } from '../body/body.service.js';
import { BodyRecordDto } from '../body/dto.js';
import type { Member } from '../libs/database/entities/member.entity.js';
import { MemberSessionDto, MemberViewDto, MemberViewWorkoutDto, PushKeyDto } from './dto.js';
import { PushSubscriptionDto } from '../push/dto.js';
import { StrengthSeriesDto } from '../workouts/dto.js';
import { CurrentMember, MEMBER_COOKIE, MemberAuthGuard } from './member-auth.guard.js';
import { MEMBER_SESSION_DAYS, MemberViewService, PAGE_SIZE } from './member-view.service.js';
import { PushService } from '../push/push.service.js';
import { PushSubscriptionRepository } from '../libs/database/repositories/push-subscription.repository.js';
import { ExerciseRepository } from '../libs/database/repositories/exercise.repository.js';
import { NoticeRepository } from '../libs/database/repositories/notice.repository.js';
import { listNotices, markNoticeRead, NoticeDto } from '../notices/notices.js';
import { PersonalWorkoutRepository } from '../libs/database/repositories/personal-workout.repository.js';
import { ExerciseCatalogDto } from '../exercises/exercises.controller.js';
import { PersonalWorkoutCommentDto, PersonalWorkoutDto, SaveCommentDto, SavePersonalWorkoutDto } from '../personal-workouts/dto.js';
import { PersonalWorkoutsService } from '../personal-workouts/personal-workouts.service.js';

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
    private readonly personalWorkoutsService: PersonalWorkoutsService,
    private readonly personalWorkoutRepository: PersonalWorkoutRepository,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly noticeRepository: NoticeRepository,
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

  @Get('me/strength')
  @UseGuards(MemberAuthGuard)
  @ApiOkResponse({ type: [StrengthSeriesDto], description: '종목별 최고 중량 추이 — 2일 이상 기록된 종목, 기록 많은 순' })
  @ApiUnauthorizedResponse()
  strength(@CurrentMember() member: Member) {
    return this.memberViewService.strength(member);
  }

  @Get('me/body-records')
  @UseGuards(MemberAuthGuard)
  @ApiOkResponse({ type: [BodyRecordDto], description: '날짜 오름차순' })
  @ApiUnauthorizedResponse()
  bodyRecords(@CurrentMember() member: Member) {
    return this.bodyService.listByMemberId(member.id);
  }

  // 개인운동 — 회원이 직접 기록, 담당 트레이너와 댓글
  @Get('me/personal-workouts')
  @UseGuards(MemberAuthGuard)
  @ApiQuery({ name: 'before', required: false, example: '2026-10-30', description: '이 날짜 이전 기록 (무한 스크롤)' })
  @ApiOkResponse({ type: [PersonalWorkoutDto], description: `최신순 최대 ${PAGE_SIZE}개` })
  @ApiUnauthorizedResponse()
  personalWorkouts(@CurrentMember() member: Member, @Query('before') before?: string) {
    return this.personalWorkoutsService.list(member, before);
  }

  @Put('me/personal-workouts/:date')
  @UseGuards(MemberAuthGuard)
  @HttpCode(204)
  @ApiNoContentResponse({ description: '같은 날짜면 덮어쓰기. 처음 작성하면 트레이너에게 알림' })
  @ApiBadRequestResponse({ description: '종목·내용 둘 다 비어 있음' })
  @ApiUnauthorizedResponse()
  savePersonalWorkout(@CurrentMember() member: Member, @Param('date') date: string, @Body() dto: SavePersonalWorkoutDto) {
    return this.personalWorkoutsService.save(member, date, dto);
  }

  @Delete('me/personal-workouts/:date')
  @UseGuards(MemberAuthGuard)
  @HttpCode(204)
  @ApiNoContentResponse({ description: '댓글도 함께 삭제' })
  @ApiUnauthorizedResponse()
  removePersonalWorkout(@CurrentMember() member: Member, @Param('date') date: string) {
    return this.personalWorkoutsService.remove(member, date);
  }

  @Post('me/personal-workouts/:date/comments')
  @UseGuards(MemberAuthGuard)
  @ApiCreatedResponse({ type: PersonalWorkoutCommentDto })
  @ApiNotFoundResponse()
  @ApiUnauthorizedResponse()
  addPersonalWorkoutComment(@CurrentMember() member: Member, @Param('date') date: string, @Body() dto: SaveCommentDto) {
    return this.personalWorkoutsService.addComment(member, date, 'member', dto);
  }

  @Delete('me/personal-workouts/:date/comments/:id')
  @UseGuards(MemberAuthGuard)
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: '없거나 내가 쓴 댓글이 아님' })
  @ApiUnauthorizedResponse()
  async removePersonalWorkoutComment(
    @CurrentMember() member: Member,
    @Param('date') date: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.personalWorkoutsService.removeComment(member, date, id, 'member');
  }

  // 개인운동 운동 추가 창 — 기본 종목 + 이 회원이 직접 입력했던 종목
  @Get('exercises')
  @UseGuards(MemberAuthGuard)
  @ApiOkResponse({ type: [ExerciseCatalogDto] })
  @ApiUnauthorizedResponse()
  exercises(): Promise<ExerciseCatalogDto[]> {
    return this.exerciseRepository.listAll();
  }

  @Get('me/exercises/custom')
  @UseGuards(MemberAuthGuard)
  @ApiOkResponse({ type: [String], description: '기본 종목에 없는 이름, 최근 쓴 순' })
  @ApiUnauthorizedResponse()
  customExercises(@CurrentMember() member: Member): Promise<string[]> {
    return this.personalWorkoutRepository.listCustomExerciseNames(member.id);
  }

  @Get('notices')
  @UseGuards(MemberAuthGuard)
  @ApiOkResponse({ type: [NoticeDto], description: '최신순' })
  @ApiUnauthorizedResponse()
  notices(@CurrentMember() member: Member): Promise<NoticeDto[]> {
    return listNotices(this.noticeRepository, { audience: 'member', id: member.id });
  }

  @Post('notices/:id/read')
  @UseGuards(MemberAuthGuard)
  @HttpCode(204)
  @ApiNoContentResponse({ description: '읽음 (이미 읽었으면 그대로)' })
  @ApiNotFoundResponse()
  @ApiUnauthorizedResponse()
  markNoticeRead(@CurrentMember() member: Member, @Param('id', ParseUUIDPipe) id: string) {
    return markNoticeRead(this.noticeRepository, id, { audience: 'member', id: member.id });
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
