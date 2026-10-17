import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { generateMemberCode } from './member-code.js';
import { Member } from './member.entity.js';
import { WorkoutLog } from '../workouts/workout-log.entity.js';
import type { CreateMemberWithPtDto, MemberDto, UpdateMemberDto } from './dto.js';

// used = pt_counted_since 이후 작성된 운동일지 수
const toDto = ({ code, name, memo, ptTotal }: Member, used = 0): MemberDto => ({
  code,
  name,
  memo,
  ptRemaining: ptTotal === null ? null : ptTotal - used,
});

// 남은 횟수를 정하는 시점부터 새로 셈 — 이미 쓴 일지는 빼고, 이후 작성되는 일지만 1회씩 차감
const ptFrom = (remaining: number | null | undefined) =>
  remaining == null ? { ptTotal: null, ptCountedSince: null } : { ptTotal: remaining, ptCountedSince: new Date() };

@Injectable()
export class MembersService {
  constructor(@InjectRepository(Member) private readonly members: Repository<Member>) {}

  async list(trainerId: string) {
    const rows = await this.members.find({ where: { trainerId, disconnectedAt: IsNull() }, order: { createdAt: 'ASC' } });
    const used = await this.ptUsed(rows);
    return rows.map((m) => toDto(m, used.get(m.id)));
  }

  create(trainerId: string, { name, memo = '', ptRemaining }: CreateMemberWithPtDto) {
    return this.withNewCode(async (code) => toDto(await this.members.save(this.members.create({ trainerId, name, memo, code, ...ptFrom(ptRemaining) }))));
  }

  // 남은 PT 횟수 지정 (첫 등록·재등록·노쇼 차감·서비스 추가 모두 "지금부터 남은 횟수"로)
  async setPt(trainerId: string, code: string, remaining: number | null) {
    const member = await this.findOwned(trainerId, code);
    Object.assign(member, ptFrom(remaining));
    return toDto(await this.members.save(member));
  }

  async toDtoWithPt(member: Member) {
    return toDto(member, (await this.ptUsed([member])).get(member.id));
  }

  // 회원별 차감 횟수 — 횟수 관리 중인 회원만 한 번에 집계
  private async ptUsed(members: Member[]) {
    const ids = members.filter((m) => m.ptCountedSince).map((m) => m.id);
    if (!ids.length) return new Map<string, number>();
    const rows = await this.members.manager
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

  // 코드 재발급: 기존 코드·이미 발급된 회원 토큰 모두 무효 (기록은 내부 id 로 연결돼 유지)
  async reissueCode(trainerId: string, code: string) {
    const member = await this.findOwned(trainerId, code);
    return this.withNewCode(async (newCode) => {
      Object.assign(member, { code: newCode, codeIssuedAt: new Date() });
      return this.toDtoWithPt(await this.members.save(member));
    });
  }

  // 코드 충돌(unique 위반) 시 새 코드로 재시도 (21억 조합이라 사실상 1회)
  private async withNewCode<T>(run: (code: string) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await run(generateMemberCode());
      } catch (e) {
        const unique = e instanceof QueryFailedError && (e.driverError as { code?: string }).code === '23505';
        if (!unique || attempt >= 4) throw e;
      }
    }
  }

  async update(trainerId: string, code: string, { name, memo }: UpdateMemberDto) {
    const member = await this.findOwned(trainerId, code);
    member.name = name;
    if (memo !== undefined) member.memo = memo;
    return this.toDtoWithPt(await this.members.save(member));
  }

  // 소프트 삭제(연결 해제): 목록·일지·달력에서 사라지고 코드도 무효. 기록은 보관 — 실수 복구 대비
  async disconnect(trainerId: string, code: string) {
    const member = await this.findOwned(trainerId, code);
    await this.members.update({ id: member.id }, { disconnectedAt: new Date() });
  }

  // 이 트레이너에게 연결된 회원만. 남의 회원 코드면 존재 여부도 드러내지 않고 404
  async findOwned(trainerId: string, code: string) {
    const member = await this.members.findOneBy({ trainerId, code: code.toUpperCase(), disconnectedAt: IsNull() });
    if (!member) throw new NotFoundException('회원을 찾을 수 없습니다');
    return member;
  }
}
