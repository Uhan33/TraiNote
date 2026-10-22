import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { SaveWorkoutDto, StrengthSeriesDto, WorkoutLogDto } from './dto.js';
import { WorkoutsService } from './workouts.service.js';

@ApiTags('workouts')
@Controller()
@UseGuards(AuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get('workouts')
  @ApiQuery({ name: 'date', example: '2026-10-17' })
  @ApiOkResponse({ type: [WorkoutLogDto] })
  listByDate(@CurrentTrainerId() trainerId: string, @Query('date') date: string) {
    return this.workoutsService.listByDate(trainerId, date);
  }

  @Get('workouts/dates')
  @ApiOkResponse({ type: [String], description: '일지가 있는 날짜(YYYY-MM-DD) — 전체 회원' })
  loggedDates(@CurrentTrainerId() trainerId: string) {
    return this.workoutsService.loggedDates(trainerId);
  }

  @Get('workouts/drafts')
  @ApiOkResponse({ type: [WorkoutLogDto], description: '작성 완료 전 일지 (회원에게 안 보임) — 최신순' })
  listDrafts(@CurrentTrainerId() trainerId: string) {
    return this.workoutsService.listDrafts(trainerId);
  }

  @Get('members/:code/workouts/dates')
  @ApiOkResponse({ type: [String], description: '이 회원의 일지가 있는 날짜' })
  memberLoggedDates(@CurrentTrainerId() trainerId: string, @Param('code') code: string) {
    return this.workoutsService.loggedDates(trainerId, code);
  }

  @Get('members/:code/strength')
  @ApiOkResponse({ type: [StrengthSeriesDto], description: '종목별 최고 중량 추이 (회원 화면과 같음)' })
  strength(@CurrentTrainerId() trainerId: string, @Param('code') code: string) {
    return this.workoutsService.strength(trainerId, code);
  }

  @Get('members/:code/workouts/previous')
  @ApiQuery({ name: 'before', example: '2026-10-17' })
  @ApiOkResponse({ type: WorkoutLogDto })
  @ApiNotFoundResponse()
  previous(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Query('before') before: string) {
    return this.workoutsService.previous(trainerId, code, before);
  }

  @Get('members/:code/workouts/:date')
  @ApiOkResponse({ type: WorkoutLogDto })
  @ApiNotFoundResponse({ description: '그날 일지 없음' })
  get(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Param('date') date: string) {
    return this.workoutsService.get(trainerId, code, date);
  }

  @Put('members/:code/workouts/:date')
  @HttpCode(204)
  @ApiNoContentResponse()
  save(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Param('date') date: string, @Body() dto: SaveWorkoutDto) {
    return this.workoutsService.save(trainerId, code, date, dto);
  }

  @Post('members/:code/workouts/:date/complete')
  @HttpCode(204)
  @ApiNoContentResponse({ description: '작성 완료 (이미 완료면 그대로)' })
  @ApiNotFoundResponse({ description: '그날 일지 없음' })
  complete(@CurrentTrainerId() trainerId: string, @Param('code') code: string, @Param('date') date: string) {
    return this.workoutsService.complete(trainerId, code, date);
  }
}
