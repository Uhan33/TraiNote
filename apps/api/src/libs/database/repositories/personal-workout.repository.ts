import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { PersonalWorkout } from '../entities/personal-workout.entity.js';
import { BaseRepository } from './base.repository.js';

type Content = Pick<PersonalWorkout, 'content' | 'exercises'>;

@Injectable()
export class PersonalWorkoutRepository extends BaseRepository<PersonalWorkout> {
  constructor(@InjectRepository(PersonalWorkout) repository: Repository<PersonalWorkout>) {
    super(repository);
  }

  // 최신순 take 개 + 댓글(오래된 순). before(YYYY-MM-DD) 이전만 — 무한 스크롤 커서
  listRecent(memberId: string, take: number, before?: string) {
    return this.find({
      where: { memberId, ...(before ? { logDate: LessThan(before) } : {}) },
      relations: { comments: true },
      order: { logDate: 'DESC', comments: { createdAt: 'ASC' } },
      take,
    });
  }

  findByDate(memberId: string, logDate: string) {
    return this.findOneBy({ memberId, logDate });
  }

  // 그날 기록이 있으면 덮어쓰기. true = 새로 작성. 트레이너 화면에 '안 읽음'
  async saveByDate(memberId: string, logDate: string, values: Content) {
    const memberUpdatedAt = new Date();
    if (await this.update({ memberId, logDate }, { ...values, memberUpdatedAt })) return false;
    await this.insertOne({ memberId, logDate, ...values, memberUpdatedAt });
    return true;
  }

  // 회원이 댓글을 달면 트레이너 화면에 다시 '안 읽음'
  async touchByMember(id: string) {
    await this.update({ id }, { memberUpdatedAt: new Date() });
  }

  async markReadByTrainer(memberId: string, logDate: string) {
    await this.update({ memberId, logDate }, { trainerReadAt: new Date() });
  }

  // 트레이너의 연결 중인 회원별 안 읽은 기록 수 (0 인 회원은 빠짐)
  async countUnreadByTrainer(trainerId: string) {
    const rows: { code: string; count: number }[] = await this.repository.query(
      `SELECT m.code, count(*)::int AS count
         FROM personal_workout w
         JOIN member m ON m.id = w.member_id
        WHERE m.trainer_id = $1 AND m.disconnected_at IS NULL
          AND (w.trainer_read_at IS NULL OR w.member_updated_at > w.trainer_read_at)
        GROUP BY m.code`,
      [trainerId],
    );
    return rows;
  }

  deleteByDate(memberId: string, logDate: string) {
    return this.delete({ memberId, logDate });
  }

  // 이 회원이 개인운동에 직접 입력했던 종목 (기본 종목 제외, 최근 쓴 순). 트레이너가 PT 일지에 입력한 종목은 넣지 않음 — 트레이너 검색 기록처럼 보이지 않게
  async listCustomExerciseNames(memberId: string) {
    const rows: { name: string }[] = await this.repository.query(
      `SELECT e->>'name' AS name
         FROM personal_workout w
         CROSS JOIN jsonb_array_elements(w.exercises) e
        WHERE w.member_id = $1 AND NOT EXISTS (SELECT 1 FROM exercise x WHERE x.name = e->>'name')
        GROUP BY 1
        ORDER BY max(w.updated_at) DESC
        LIMIT 100`,
      [memberId],
    );
    return rows.map((r) => r.name);
  }
}
