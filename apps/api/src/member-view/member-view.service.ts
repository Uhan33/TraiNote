import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThan, Repository } from 'typeorm';
import { Member } from '../members/member.entity.js';
import { assertDate } from '../workouts/workouts.service.js';
import { WorkoutLog } from '../workouts/workout-log.entity.js';
import type { MemberViewDto, MemberViewWorkoutDto } from './dto.js';
import type { MemberTokenPayload } from './member-auth.guard.js';

export const PAGE_SIZE = 10;
export const MEMBER_SESSION_DAYS = 365;

@Injectable()
export class MemberViewService {
  constructor(
    @InjectRepository(Member) private readonly members: Repository<Member>,
    @InjectRepository(WorkoutLog) private readonly logs: Repository<WorkoutLog>,
    private readonly jwt: JwtService,
  ) {}

  // 코드 → 회원 토큰. 없는 코드·삭제된 회원 같은 응답 (존재 여부 노출 안 함)
  async createSession(code: string) {
    const member = await this.members.findOneBy({ code, disconnectedAt: IsNull() });
    if (!member) throw new UnauthorizedException('회원 코드가 올바르지 않아요');
    const payload: MemberTokenPayload = { sub: member.id, typ: 'member', cia: member.codeIssuedAt.getTime() };
    return this.jwt.signAsync(payload, { expiresIn: `${MEMBER_SESSION_DAYS}d` });
  }

  async profile(member: Member, month: string): Promise<MemberViewDto> {
    if (!/^\d{4}-\d{2}$/.test(month)) throw new BadRequestException('month 는 YYYY-MM 형식이어야 합니다');
    const [y, m] = month.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const [monthCount, totalCount] = await Promise.all([
      this.logs.countBy({ memberId: member.id, logDate: Between(`${month}-01`, `${month}-${String(lastDay).padStart(2, '0')}`) }),
      this.logs.countBy({ memberId: member.id }),
    ]);
    return { name: member.name, trainerName: member.trainer.name, monthCount, totalCount };
  }

  // 최신순 PAGE_SIZE 개. before(YYYY-MM-DD) 보다 이전만 — 무한 스크롤 커서
  async workouts(member: Member, before?: string): Promise<MemberViewWorkoutDto[]> {
    const rows = await this.logs.find({
      where: { memberId: member.id, ...(before ? { logDate: LessThan(assertDate(before)) } : {}) },
      order: { logDate: 'DESC' },
      take: PAGE_SIZE,
    });
    return rows.map(({ logDate, title, memo, exercises }) => ({ date: logDate, title, memo, exercises }));
  }
}
