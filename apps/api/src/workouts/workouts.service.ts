import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembersService } from '../members/members.service.js';
import type { SaveWorkoutDto, WorkoutLogDto } from './dto.js';
import { WorkoutLog } from '../libs/database/entities/workout-log.entity.js';
import { WorkoutLogRepository } from '../libs/database/repositories/workout-log.repository.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function assertDate(date: string | undefined): string {
  const parsed = date && DATE.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  // 2026-02-31 처럼 없는 날짜도 거름 (UTC 기준 왕복 비교)
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new BadRequestException('날짜는 YYYY-MM-DD 형식이어야 합니다');
  }
  return date;
}

const toDto = (log: WorkoutLog, memberCode: string): WorkoutLogDto => ({
  memberCode,
  date: log.logDate,
  title: log.title,
  memo: log.memo,
  exercises: log.exercises,
});

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly workoutLogRepository: WorkoutLogRepository,
    private readonly membersService: MembersService,
  ) {}

  // 그날 이 트레이너의 모든 회원 일지 (운동일지 목록 화면)
  async listByDate(trainerId: string, date: string) {
    const rows = await this.workoutLogRepository.listByTrainerAndDate(trainerId, assertDate(date));
    return rows.map((log) => toDto(log, log.member.code));
  }

  // 일지가 있는 날짜 목록 (달력 점 표시). memberCode 없으면 전체 회원
  loggedDates(trainerId: string, memberCode?: string) {
    return this.workoutLogRepository.loggedDates(trainerId, memberCode?.toUpperCase());
  }

  async get(trainerId: string, memberCode: string, date: string) {
    const member = await this.membersService.findOwned(trainerId, memberCode);
    const log = await this.workoutLogRepository.findByDate(member.id, assertDate(date));
    if (!log) throw new NotFoundException('일지가 없습니다');
    return toDto(log, member.code);
  }

  // date 이전 가장 최근 일지 ("지난 기록 불러오기")
  async previous(trainerId: string, memberCode: string, before: string) {
    const member = await this.membersService.findOwned(trainerId, memberCode);
    const log = await this.workoutLogRepository.findPrevious(member.id, assertDate(before));
    if (!log) throw new NotFoundException('이전 일지가 없습니다');
    return toDto(log, member.code);
  }

  async save(trainerId: string, memberCode: string, date: string, dto: SaveWorkoutDto) {
    const member = await this.membersService.findOwned(trainerId, memberCode);
    const logDate = assertDate(date);
    if (dto.exercises.length === 0) {
      await this.workoutLogRepository.deleteByDate(member.id, logDate);
      return;
    }
    await this.workoutLogRepository.upsertByDate(member.id, logDate, { title: dto.title.trim(), memo: dto.memo, exercises: dto.exercises });
  }
}
