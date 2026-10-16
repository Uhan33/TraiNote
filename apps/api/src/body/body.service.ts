import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembersService } from '../members/members.service.js';
import { assertDate } from '../workouts/workouts.service.js';
import { BodyRecord } from './body-record.entity.js';
import type { BodyRecordDto, SaveBodyRecordDto } from './dto.js';

@Injectable()
export class BodyService {
  constructor(
    @InjectRepository(BodyRecord) private readonly records: Repository<BodyRecord>,
    private readonly members: MembersService,
  ) {}

  // 날짜 오름차순 전체 (그래프·목록)
  // ponytail: 전체 기간 반환. 수년치 매일 기록으로 무거워지면 기간 파라미터 추가
  async listByMemberId(memberId: string): Promise<BodyRecordDto[]> {
    const rows = await this.records.find({ where: { memberId }, order: { recordDate: 'ASC' } });
    return rows.map((r) => ({ date: r.recordDate, weightKg: r.weightKg, bodyFatPct: r.bodyFatPct, skeletalMuscleKg: r.skeletalMuscleKg }));
  }

  async list(trainerId: string, code: string) {
    const member = await this.members.findOwned(trainerId, code);
    return this.listByMemberId(member.id);
  }

  // 같은 날짜면 통째로 덮어쓰기 (비운 항목은 null)
  async save(trainerId: string, code: string, date: string, dto: SaveBodyRecordDto) {
    const member = await this.members.findOwned(trainerId, code);
    await this.records.upsert(
      {
        memberId: member.id,
        recordDate: assertDate(date),
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct ?? null,
        skeletalMuscleKg: dto.skeletalMuscleKg ?? null,
        updatedAt: new Date(),
      },
      ['memberId', 'recordDate'],
    );
  }

  async remove(trainerId: string, code: string, date: string) {
    const member = await this.members.findOwned(trainerId, code);
    await this.records.delete({ memberId: member.id, recordDate: assertDate(date) });
  }
}
