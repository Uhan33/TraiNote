import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyRecord } from '../entities/body-record.entity.js';
import { BaseRepository } from './base.repository.js';

type Measurements = Pick<BodyRecord, 'weightKg' | 'bodyFatPct' | 'skeletalMuscleKg'>;

@Injectable()
export class BodyRecordRepository extends BaseRepository<BodyRecord> {
  constructor(@InjectRepository(BodyRecord) repository: Repository<BodyRecord>) {
    super(repository);
  }

  // 날짜 오름차순 전체
  // ponytail: 전체 기간 반환. 수년치 매일 기록으로 무거워지면 기간 파라미터 추가
  listByMember(memberId: string) {
    return this.find({ where: { memberId }, order: { recordDate: 'ASC' } });
  }

  // 회원·날짜당 1개 — 있으면 통째로 덮어쓰기
  upsertByDate(memberId: string, recordDate: string, values: Measurements) {
    return this.upsert({ memberId, recordDate, ...values, updatedAt: new Date() }, ['memberId', 'recordDate']);
  }

  deleteByDate(memberId: string, recordDate: string) {
    return this.delete({ memberId, recordDate });
  }
}
