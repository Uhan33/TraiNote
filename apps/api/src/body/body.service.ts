import { Injectable } from '@nestjs/common';
import { MembersService } from '../members/members.service.js';
import { assertDate } from '../workouts/workouts.service.js';
import { BodyRecordRepository } from '../libs/database/repositories/body-record.repository.js';
import type { BodyRecordDto, SaveBodyRecordDto } from './dto.js';

@Injectable()
export class BodyService {
  constructor(
    private readonly bodyRecordRepository: BodyRecordRepository,
    private readonly membersService: MembersService,
  ) {}

  // 날짜 오름차순 전체 (그래프·목록)
  async listByMemberId(memberId: string): Promise<BodyRecordDto[]> {
    const rows = await this.bodyRecordRepository.listByMember(memberId);
    return rows.map((r) => ({ date: r.recordDate, weightKg: r.weightKg, bodyFatPct: r.bodyFatPct, skeletalMuscleKg: r.skeletalMuscleKg }));
  }

  async list(trainerId: string, code: string) {
    const member = await this.membersService.findOwned(trainerId, code);
    return this.listByMemberId(member.id);
  }

  // 같은 날짜면 통째로 덮어쓰기 (비운 항목은 null)
  async save(trainerId: string, code: string, date: string, dto: SaveBodyRecordDto) {
    const member = await this.membersService.findOwned(trainerId, code);
    await this.bodyRecordRepository.upsertByDate(member.id, assertDate(date), {
      weightKg: dto.weightKg,
      bodyFatPct: dto.bodyFatPct ?? null,
      skeletalMuscleKg: dto.skeletalMuscleKg ?? null,
    });
  }

  async remove(trainerId: string, code: string, date: string) {
    const member = await this.membersService.findOwned(trainerId, code);
    await this.bodyRecordRepository.deleteByDate(member.id, assertDate(date));
  }
}
