import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Member } from '../libs/database/entities/member.entity.js';
import { MemberRepository } from '../libs/database/repositories/member.repository.js';
import { MembersService } from '../members/members.service.js';
import { WorkoutLogRepository } from '../libs/database/repositories/workout-log.repository.js';
import { assertDate } from '../workouts/workouts.service.js';
import type { MemberViewDto, MemberViewWorkoutDto } from './dto.js';
import type { MemberTokenPayload } from './member-auth.guard.js';

export const PAGE_SIZE = 10;
export const MEMBER_SESSION_DAYS = 365;

@Injectable()
export class MemberViewService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly membersService: MembersService,
    private readonly workoutLogRepository: WorkoutLogRepository,
    private readonly jwtService: JwtService,
  ) {}

  // 코드 → 회원 토큰. 없는 코드·삭제된 회원 같은 응답 (존재 여부 노출 안 함)
  async createSession(code: string) {
    const member = await this.memberRepository.findByCode(code);
    if (!member) throw new UnauthorizedException('회원 코드가 올바르지 않아요');
    const payload: MemberTokenPayload = { sub: member.id, typ: 'member', cia: member.codeIssuedAt.getTime() };
    return this.jwtService.signAsync(payload, { expiresIn: `${MEMBER_SESSION_DAYS}d` });
  }

  async profile(member: Member, month: string): Promise<MemberViewDto> {
    if (!/^\d{4}-\d{2}$/.test(month)) throw new BadRequestException('month 는 YYYY-MM 형식이어야 합니다');
    const [y, m] = month.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const [monthCount, totalCount, ptRemaining] = await Promise.all([
      this.workoutLogRepository.countByMember(member.id, `${month}-01`, `${month}-${String(lastDay).padStart(2, '0')}`),
      this.workoutLogRepository.countByMember(member.id),
      this.membersService.ptRemaining(member),
    ]);
    return { name: member.name, trainerName: member.trainer.name, monthCount, totalCount, ptRemaining };
  }

  // 최신순 PAGE_SIZE 개. before(YYYY-MM-DD) 보다 이전만 — 무한 스크롤 커서
  async workouts(member: Member, before?: string): Promise<MemberViewWorkoutDto[]> {
    const rows = await this.workoutLogRepository.listRecent(member.id, PAGE_SIZE, before && assertDate(before));
    return rows.map(({ logDate, title, memo, exercises }) => ({ date: logDate, title, memo, exercises }));
  }
}
