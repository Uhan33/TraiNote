import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { generateMemberCode } from './member-code.js';
import { Member } from './member.entity.js';
import type { CreateMemberDto, MemberDto, UpdateMemberDto } from './dto.js';

const toDto = ({ code, name, memo }: Member): MemberDto => ({ code, name, memo });

@Injectable()
export class MembersService {
  constructor(@InjectRepository(Member) private readonly members: Repository<Member>) {}

  async list(trainerId: string) {
    const rows = await this.members.find({ where: { trainerId, disconnectedAt: IsNull() }, order: { createdAt: 'ASC' } });
    return rows.map(toDto);
  }

  create(trainerId: string, { name, memo = '' }: CreateMemberDto) {
    return this.withNewCode(async (code) => toDto(await this.members.save(this.members.create({ trainerId, name, memo, code }))));
  }

  // 코드 재발급: 기존 코드·이미 발급된 회원 토큰 모두 무효 (기록은 내부 id 로 연결돼 유지)
  async reissueCode(trainerId: string, code: string) {
    const member = await this.findOwned(trainerId, code);
    return this.withNewCode(async (newCode) => {
      Object.assign(member, { code: newCode, codeIssuedAt: new Date() });
      return toDto(await this.members.save(member));
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
    return toDto(await this.members.save(member));
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
