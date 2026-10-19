import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThan, Not, Repository } from 'typeorm';
import { WorkoutLog } from '../entities/workout-log.entity.js';
import { BaseRepository } from './base.repository.js';

type LogContent = Pick<WorkoutLog, 'title' | 'memo' | 'exercises'>;

@Injectable()
export class WorkoutLogRepository extends BaseRepository<WorkoutLog> {
  constructor(@InjectRepository(WorkoutLog) repository: Repository<WorkoutLog>) {
    super(repository);
  }

  // 그날 이 트레이너의 연결 중인 회원 일지 (회원 함께 조회)
  listByTrainerAndDate(trainerId: string, date: string) {
    return this.repository
      .createQueryBuilder('w')
      .innerJoinAndSelect('w.member', 'm')
      .where('m.trainer_id = :trainerId AND m.disconnected_at IS NULL AND w.log_date = :date', { trainerId, date })
      .getMany();
  }

  // 일지가 있는 날짜 목록. memberCode 없으면 전체 회원
  // ponytail: 전체 기간을 한 번에 반환. 수년치가 쌓여 무거워지면 월 단위 범위 파라미터 추가
  async loggedDates(trainerId: string, memberCode?: string) {
    const query = this.repository
      .createQueryBuilder('w')
      .innerJoin('w.member', 'm')
      // pg 드라이버가 date 를 JS Date(시간대 영향)로 바꾸지 않도록 문자열로 조회
      .select("DISTINCT to_char(w.log_date, 'YYYY-MM-DD')", 'date')
      .where('m.trainer_id = :trainerId AND m.disconnected_at IS NULL', { trainerId })
      .orderBy('date');
    if (memberCode) query.andWhere('m.code = :code', { code: memberCode });
    const rows = await query.getRawMany<{ date: string }>();
    return rows.map((r) => r.date);
  }

  findByDate(memberId: string, logDate: string) {
    return this.findOneBy({ memberId, logDate });
  }

  // before 이전 가장 최근 일지
  findPrevious(memberId: string, before: string) {
    return this.findOne({ where: { memberId, logDate: LessThan(before) }, order: { logDate: 'DESC' } });
  }

  // 회원 화면용 — 작성 완료된 일지만
  // 최신순 take 개. before 가 있으면 그 날짜 이전만 (무한 스크롤 커서)
  listRecentCompleted(memberId: string, take: number, before?: string) {
    return this.find({
      where: { memberId, completedAt: Not(IsNull()), ...(before ? { logDate: LessThan(before) } : {}) },
      order: { logDate: 'DESC' },
      take,
    });
  }

  // 작성 완료된 일지 수. from~to(포함) 기간, 생략하면 전체
  countCompletedByMember(memberId: string, from?: string, to?: string) {
    return this.countBy({ memberId, completedAt: Not(IsNull()), ...(from && to ? { logDate: Between(from, to) } : {}) });
  }

  // 회원·날짜당 1개 — 있으면 덮어쓰기 (created_at 유지: PT 차감 기준)
  upsertByDate(memberId: string, logDate: string, content: LogContent) {
    return this.upsert({ memberId, logDate, ...content, updatedAt: new Date() }, ['memberId', 'logDate']);
  }

  // 처음 완료할 때만 기록 — 이미 완료면 false (다시 알리지 않음)
  async markCompleted(id: string) {
    return (await this.update({ id, completedAt: IsNull() }, { completedAt: new Date() })) === 1;
  }

  deleteByDate(memberId: string, logDate: string) {
    return this.delete({ memberId, logDate });
  }
}
