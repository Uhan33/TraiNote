import { ConflictException, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { isUniqueViolation } from '../libs/database/errors.js';
import { FailureLimiter } from '../libs/security/failure-limiter.js';
import { Trainer } from '../libs/database/entities/trainer.entity.js';
import { TrainerRepository } from '../libs/database/repositories/trainer.repository.js';
import type { LoginDto, SignupDto, TrainerDto } from './dto.js';
import { hashPassword, verifyPassword } from './password.js';

// 존재하지 않는 아이디도 해시 비교 시간을 들여 아이디 존재 여부가 응답 시간으로 드러나지 않게 함
const DUMMY_HASH = await hashPassword('dummy-password-for-timing');

const toDto = ({ id, loginId, email, name, role }: Trainer): TrainerDto => ({ id, loginId, email, name, role });

@Injectable()
export class AuthService {
  constructor(private readonly trainerRepository: TrainerRepository) {}

  async signup(dto: SignupDto) {
    const existing = await this.trainerRepository.findDuplicate(dto.loginId, dto.email);
    if (existing) throw this.duplicate(existing.loginId === dto.loginId ? 'loginId' : 'email');

    try {
      const trainer = await this.trainerRepository.add({
        loginId: dto.loginId,
        email: dto.email ?? null,
        name: dto.name,
        passwordHash: await hashPassword(dto.password),
      });
      return toDto(trainer);
    } catch (e) {
      // 동시 가입으로 위 확인을 통과한 경우 — DB unique 제약이 최종 방어
      if (isUniqueViolation(e)) {
        throw this.duplicate(String((e.driverError as { detail?: string }).detail).includes('login_id') ? 'loginId' : 'email');
      }
      throw e;
    }
  }

  // 아이디별 실패 제한: 15분에 10번 틀리면 15분 잠금 — IP 를 바꿔 가며 한 계정에 비밀번호를 대입하는 공격 차단
  // 없는 아이디도 똑같이 세어 계정 존재 여부가 드러나지 않음
  private readonly loginFailures = new FailureLimiter(10, 15 * 60_000, 15 * 60_000);
  private readonly logger = new Logger('Security');

  async login(dto: LoginDto) {
    if (this.loginFailures.isLocked(dto.loginId)) {
      throw new HttpException('로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요', HttpStatus.TOO_MANY_REQUESTS);
    }
    const trainer = await this.trainerRepository.findByLoginId(dto.loginId);
    const ok = await verifyPassword(dto.password, trainer?.passwordHash ?? DUMMY_HASH);
    if (!trainer?.passwordHash || !ok) {
      if (this.loginFailures.fail(dto.loginId)) this.logger.warn({ event: 'login_locked', loginId: dto.loginId });
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
    }
    this.loginFailures.reset(dto.loginId);
    return toDto(trainer);
  }

  async me(trainerId: string) {
    const trainer = await this.trainerRepository.findById(trainerId);
    if (!trainer) throw new UnauthorizedException('로그인이 필요합니다');
    return toDto(trainer);
  }

  private duplicate(field: 'loginId' | 'email') {
    return new ConflictException({
      field,
      message: field === 'loginId' ? '이미 사용 중인 아이디입니다' : '이미 가입된 이메일입니다',
    });
  }
}
