import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { MembersService } from '../members/members.service.js';
import { PersonalWorkoutCommentDto, PersonalWorkoutDto, SaveCommentDto, UnreadCountDto } from './dto.js';
import { PAGE_SIZE, PersonalWorkoutsService } from './personal-workouts.service.js';

// 트레이너용 — 담당 회원의 개인운동 보기·댓글. 작성·수정은 회원만 (/member/me/personal-workouts)
@ApiTags('personal-workouts')
@Controller()
@UseGuards(AuthGuard)
export class PersonalWorkoutsController {
  constructor(
    private readonly personalWorkoutsService: PersonalWorkoutsService,
    private readonly membersService: MembersService,
  ) {}

  @Get('personal-workouts/unread')
  @ApiOkResponse({ type: [UnreadCountDto], description: '회원별 안 읽은 기록 수 — 없는 회원은 빠짐' })
  unread(@CurrentTrainerId() trainerId: string) {
    return this.personalWorkoutsService.unreadCounts(trainerId);
  }

  @Get('members/:code/personal-workouts')
  @ApiQuery({ name: 'before', required: false, example: '2026-10-30', description: '이 날짜 이전 기록 (무한 스크롤)' })
  @ApiOkResponse({ type: [PersonalWorkoutDto], description: `최신순 최대 ${PAGE_SIZE}개` })
  @ApiNotFoundResponse()
  async list(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Query('before') before?: string) {
    return this.personalWorkoutsService.list(await this.membersService.findOwned(trainerId, code), before);
  }

  @Post('members/:code/personal-workouts/:date/read')
  @HttpCode(204)
  @ApiNoContentResponse({ description: '열어 봄 — 안 읽음 해제' })
  @ApiNotFoundResponse()
  async markRead(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Param('date') date: string) {
    await this.personalWorkoutsService.markRead(await this.membersService.findOwned(trainerId, code), date);
  }

  @Post('members/:code/personal-workouts/:date/comments')
  @ApiCreatedResponse({ type: PersonalWorkoutCommentDto })
  @ApiNotFoundResponse()
  async addComment(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Param('date') date: string, @Body() dto: SaveCommentDto) {
    return this.personalWorkoutsService.addComment(await this.membersService.findOwned(trainerId, code), date, 'trainer', dto);
  }

  @Delete('members/:code/personal-workouts/:date/comments/:id')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: '없거나 내가 쓴 댓글이 아님' })
  async removeComment(
    @CurrentTrainerId() trainerId: string,
    @Param('code') code: string,
    @Param('date') date: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.personalWorkoutsService.removeComment(await this.membersService.findOwned(trainerId, code), date, id, 'trainer');
  }
}
