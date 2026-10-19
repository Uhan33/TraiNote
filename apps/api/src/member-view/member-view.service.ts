import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Member } from '../libs/database/entities/member.entity.js';
import { MemberRepository } from '../libs/database/repositories/member.repository.js';
import { MembersService } from '../members/members.service.js';
import { FailureLimiter } from '../libs/security/failure-limiter.js';
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

  // 전체(모든 IP 합산) 코드 실패 제한: 1분에 MEMBER_CODE_FAIL_LIMIT(기본 30)번 틀리면 1분간 코드 입장 중지
  // 여러 IP 로 코드를 무작위 대입하는 공격 차단 — 이미 입장한 회원(토큰 1년)은 영향 없음
  private readonly codeFailures = new FailureLimiter(Number(process.env.MEMBER_CODE_FAIL_LIMIT) || 30, 60_000, 60_000);
  private readonly logger = new Logger('Security');

  // 코드 → 회원 토큰. 없는 코드·삭제된 회원 같은 응답 (존재 여부 노출 안 함)
  async createSession(code: string) {
    if (this.codeFailures.isLocked('all')) {
      throw new HttpException('잠시 후 다시 시도해 주세요', HttpStatus.TOO_MANY_REQUESTS);
    }
    const member = await this.memberRepository.findByCode(code);
    if (!member) {
      if (this.codeFailures.fail('all')) this.logger.warn({ event: 'member_code_locked' });
      throw new UnauthorizedException('회원 코드가 올바르지 않아요');
    }
    const payload: MemberTokenPayload = { sub: member.id, typ: 'member', cia: member.codeIssuedAt.getTime() };
    return this.jwtService.signAsync(payload, { expiresIn: `${MEMBER_SESSION_DAYS}d` });
  }

  async profile(member: Member, month: string): Promise<MemberViewDto> {
    if (!/^\d{4}-\d{2}$/.test(month)) throw new BadRequestException('month 는 YYYY-MM 형식이어야 합니다');
    const [y, m] = month.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const [monthCount, totalCount, ptRemaining] = await Promise.all([
      this.workoutLogRepository.countCompletedByMember(member.id, `${month}-01`, `${month}-${String(lastDay).padStart(2, '0')}`),
      this.workoutLogRepository.countCompletedByMember(member.id),
      this.membersService.ptRemaining(member),
    ]);
    return { name: member.name, trainerName: member.trainer.name, monthCount, totalCount, ptRemaining };
  }

  // 최신순 PAGE_SIZE 개. before(YYYY-MM-DD) 보다 이전만 — 무한 스크롤 커서
  async workouts(member: Member, before?: string): Promise<MemberViewWorkoutDto[]> {
    const rows = await this.workoutLogRepository.listRecentCompleted(member.id, PAGE_SIZE, before && assertDate(before));
    return rows.map(({ logDate, title, memo, exercises }) => ({ date: logDate, title, memo, exercises }));
  }
}
