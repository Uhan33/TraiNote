import { Injectable, NotFoundException } from '@nestjs/common';
import { isUniqueViolation } from '../libs/database/errors.js';
import { generateMemberCode } from './member-code.js';
import { Member } from '../libs/database/entities/member.entity.js';
import { MemberRepository } from '../libs/database/repositories/member.repository.js';
import { PushSubscriptionRepository } from '../libs/database/repositories/push-subscription.repository.js';
import type { CreateMemberWithPtDto, MemberDto, UpdateMemberDto } from './dto.js';

// 남은 PT 횟수 = 지정한 횟수 - 그 이후 새로 작성돼 작성 완료된 운동일지 수. null = 횟수 관리 안 함
const ptRemaining = ({ ptTotal }: Member, used = 0) => (ptTotal === null ? null : ptTotal - used);

const toDto = (member: Member, used?: number): MemberDto => ({
  code: member.code,
  name: member.name,
  memo: member.memo,
  ptRemaining: ptRemaining(member, used),
});

// 남은 횟수를 정하는 시점부터 새로 셈 — 이미 쓴 일지는 빼고, 이후 작성되는 일지만 1회씩 차감
const ptFrom = (remaining: number | null | undefined) =>
  remaining == null ? { ptTotal: null, ptCountedSince: null } : { ptTotal: remaining, ptCountedSince: new Date() };

@Injectable()
export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly pushSubscriptionRepository: PushSubscriptionRepository,
  ) {}

  async list(trainerId: string) {
    const rows = await this.memberRepository.listByTrainer(trainerId);
    const used = await this.memberRepository.countPtUsed(rows);
    return rows.map((m) => toDto(m, used.get(m.id)));
  }

  create(trainerId: string, { name, memo = '', ptRemaining }: CreateMemberWithPtDto) {
    return this.withNewCode(async (code) => toDto(await this.memberRepository.add({ trainerId, name, memo, code, ...ptFrom(ptRemaining) })));
  }

  // 남은 PT 횟수 지정 (첫 등록·재등록·노쇼 차감·서비스 추가 모두 "지금부터 남은 횟수"로)
  async setPt(trainerId: string, code: string, remaining: number | null) {
    const member = await this.findOwned(trainerId, code);
    Object.assign(member, ptFrom(remaining));
    return toDto(await this.memberRepository.save(member));
  }

  // 회원 화면용 남은 PT 횟수
  async ptRemaining(member: Member) {
    return ptRemaining(member, (await this.memberRepository.countPtUsed([member])).get(member.id));
  }

  // 코드 재발급: 기존 코드·이미 발급된 회원 토큰 모두 무효 (기록은 내부 id 로 연결돼 유지)
  async reissueCode(trainerId: string, code: string) {
    const member = await this.findOwned(trainerId, code);
    return this.withNewCode(async (newCode) => {
      Object.assign(member, { code: newCode, codeIssuedAt: new Date() });
      const saved = await this.memberRepository.save(member);
      await this.pushSubscriptionRepository.deleteByMember(member.id); // 예전 기기로 알림이 가지 않게
      return this.toDtoWithPt(saved);
    });
  }

  // 코드 충돌(unique 위반) 시 새 코드로 재시도 (21억 조합이라 사실상 1회)
  private async withNewCode<T>(run: (code: string) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await run(generateMemberCode());
      } catch (e) {
        if (!isUniqueViolation(e) || attempt >= 4) throw e;
      }
    }
  }

  async update(trainerId: string, code: string, { name, memo }: UpdateMemberDto) {
    const member = await this.findOwned(trainerId, code);
    member.name = name;
    if (memo !== undefined) member.memo = memo;
    return this.toDtoWithPt(await this.memberRepository.save(member));
  }

  // 소프트 삭제(연결 해제): 목록·일지·달력에서 사라지고 코드도 무효. 기록은 보관 — 실수 복구 대비
  async disconnect(trainerId: string, code: string) {
    const member = await this.findOwned(trainerId, code);
    await this.memberRepository.disconnect(member.id);
    await this.pushSubscriptionRepository.deleteByMember(member.id);
  }

  // 이 트레이너에게 연결된 회원만. 남의 회원 코드면 존재 여부도 드러내지 않고 404
  async findOwned(trainerId: string, code: string) {
    const member = await this.memberRepository.findOwned(trainerId, code.toUpperCase());
    if (!member) throw new NotFoundException('회원을 찾을 수 없습니다');
    return member;
  }

  private async toDtoWithPt(member: Member) {
    return toDto(member, (await this.memberRepository.countPtUsed([member])).get(member.id));
  }
}
