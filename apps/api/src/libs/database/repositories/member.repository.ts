import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Member } from '../entities/member.entity.js';
import { WorkoutLog } from '../entities/workout-log.entity.js';
import { BaseRepository } from './base.repository.js';

// 연결 해제(disconnected_at)된 회원은 모든 조회에서 제외
@Injectable()
export class MemberRepository extends BaseRepository<Member> {
  constructor(@InjectRepository(Member) repository: Repository<Member>) {
    super(repository);
  }

  listByTrainer(trainerId: string) {
    return this.find({ where: { trainerId, disconnectedAt: IsNull() }, order: { createdAt: 'ASC' } });
  }

  findOwned(trainerId: string, code: string) {
    return this.findOneBy({ trainerId, code, disconnectedAt: IsNull() });
  }

  findByCode(code: string) {
    return this.findOneBy({ code, disconnectedAt: IsNull() });
  }

  // 회원 토큰 검증용 — 회원 화면에 담당 트레이너 이름을 보여 주므로 함께 조회
  findByIdWithTrainer(id: string) {
    return this.findOne({ where: { id, disconnectedAt: IsNull() }, relations: { trainer: true } });
  }

  add(data: Pick<Member, 'trainerId' | 'name' | 'memo' | 'code' | 'ptTotal' | 'ptCountedSince'>) {
    return this.insertOne(data);
  }

  async disconnect(id: string) {
    await this.update({ id }, { disconnectedAt: new Date() });
  }

  // 회원별 PT 차감 횟수 = pt_counted_since 이후 새로 작성된 운동일지 수. 횟수 관리 중인 회원만 한 번에 집계
  async countPtUsed(members: Member[]) {
    const ids = members.filter((m) => m.ptCountedSince).map((m) => m.id);
    if (!ids.length) return new Map<string, number>();
    const rows = await this.repository.manager
      .createQueryBuilder(WorkoutLog, 'l')
      .innerJoin(Member, 'm', 'm.id = l.member_id')
      .select('l.member_id', 'id')
      .addSelect('count(*)::int', 'used')
      .where('l.member_id IN (:...ids)', { ids })
      .andWhere('l.created_at > m.pt_counted_since')
      .groupBy('l.member_id')
      .getRawMany<{ id: string; used: number }>();
    return new Map(rows.map((r) => [r.id, r.used]));
  }
}
