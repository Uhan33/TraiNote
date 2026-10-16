import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { MembersService } from '../members/members.service.js';
import type { SaveWorkoutDto, WorkoutLogDto } from './dto.js';
import { WorkoutLog } from './workout-log.entity.js';

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
    @InjectRepository(WorkoutLog) private readonly logs: Repository<WorkoutLog>,
    private readonly members: MembersService,
  ) {}

  // 그날 이 트레이너의 모든 회원 일지 (운동일지 목록 화면)
  async listByDate(trainerId: string, date: string) {
    const rows = await this.logs
      .createQueryBuilder('w')
      .innerJoinAndSelect('w.member', 'm')
      .where('m.trainer_id = :trainerId AND m.disconnected_at IS NULL AND w.log_date = :date', { trainerId, date: assertDate(date) })
      .getMany();
    return rows.map((log) => toDto(log, log.member.code));
  }

  // 일지가 있는 날짜 목록 (달력 점 표시). memberCode 없으면 전체 회원
  // ponytail: 전체 기간을 한 번에 반환. 수년치가 쌓여 무거워지면 월 단위 범위 파라미터 추가
  async loggedDates(trainerId: string, memberCode?: string) {
    const query = this.logs
      .createQueryBuilder('w')
      .innerJoin('w.member', 'm')
      // pg 드라이버가 date 를 JS Date(시간대 영향)로 바꾸지 않도록 문자열로 조회
      .select("DISTINCT to_char(w.log_date, 'YYYY-MM-DD')", 'date')
      .where('m.trainer_id = :trainerId AND m.disconnected_at IS NULL', { trainerId })
      .orderBy('date');
    if (memberCode) query.andWhere('m.code = :code', { code: memberCode.toUpperCase() });
    const rows = await query.getRawMany<{ date: string }>();
    return rows.map((r) => r.date);
  }

  async get(trainerId: string, memberCode: string, date: string) {
    const member = await this.members.findOwned(trainerId, memberCode);
    const log = await this.logs.findOneBy({ memberId: member.id, logDate: assertDate(date) });
    if (!log) throw new NotFoundException('일지가 없습니다');
    return toDto(log, member.code);
  }

  // date 이전 가장 최근 일지 ("지난 기록 불러오기")
  async previous(trainerId: string, memberCode: string, before: string) {
    const member = await this.members.findOwned(trainerId, memberCode);
    const log = await this.logs.findOne({
      where: { memberId: member.id, logDate: LessThan(assertDate(before)) },
      order: { logDate: 'DESC' },
    });
    if (!log) throw new NotFoundException('이전 일지가 없습니다');
    return toDto(log, member.code);
  }

  async save(trainerId: string, memberCode: string, date: string, dto: SaveWorkoutDto) {
    const member = await this.members.findOwned(trainerId, memberCode);
    const logDate = assertDate(date);
    if (dto.exercises.length === 0) {
      await this.logs.delete({ memberId: member.id, logDate });
      return;
    }
    await this.logs.upsert(
      { memberId: member.id, logDate, title: dto.title.trim(), memo: dto.memo, exercises: dto.exercises, updatedAt: new Date() },
      ['memberId', 'logDate'],
    );
  }
}
