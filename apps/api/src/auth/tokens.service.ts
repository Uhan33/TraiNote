import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { RefreshToken } from '../libs/database/entities/refresh-token.entity.js';
import { RefreshTokenRepository } from '../libs/database/repositories/refresh-token.repository.js';

export const ACCESS_TTL_MS = 15 * 60 * 1000; // 15분
export const REFRESH_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90일, 사용할 때마다 새로 발급되며 연장
// 탭 여러 개가 동시에 refresh 하면 한쪽은 방금 교체된 토큰을 보냄 — 이 시간 안이면 탈취로 보지 않음
const REUSE_GRACE_MS = 30 * 1000;

export type Tokens = { accessToken: string; refreshToken?: string };

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class TokensService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async issue(trainerId: string): Promise<Required<Tokens>> {
    const { tokens } = await this.insert(trainerId);
    return tokens;
  }

  // 리프레시 토큰 교체. refreshToken 이 없는 결과 = 유예 시간 내 중복 요청(쿠키는 이미 새 값)
  async rotate(refreshToken: string | undefined): Promise<Tokens> {
    const row = refreshToken && (await this.refreshTokenRepository.findByHash(sha256(refreshToken)));
    if (!row || row.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException('로그인이 만료되었습니다');

    if (row.revokedAt) {
      if (await this.isConcurrentRotation(row)) return { accessToken: await this.access(row.trainerId) };
      // 로그아웃·교체된 토큰 재사용 = 탈취 의심 → 이 트레이너의 모든 기기 로그아웃
      await this.revokeAll(row.trainerId);
      throw new UnauthorizedException('보안을 위해 다시 로그인해 주세요');
    }

    const next = await this.insert(row.trainerId);
    // 동시 요청 중 하나만 교체 성공하도록 조건부 업데이트
    if (await this.refreshTokenRepository.replaceIfActive(row.id, next.id)) return next.tokens;
    await this.refreshTokenRepository.revokeById(next.id);
    return { accessToken: next.tokens.accessToken };
  }

  // 방금(유예 시간 내) 교체됐고, 교체로 받은 새 토큰이 아직 살아 있을 때만 정상 동시 요청으로 인정
  private async isConcurrentRotation(row: RefreshToken) {
    if (!row.replacedById || !row.revokedAt || Date.now() - row.revokedAt.getTime() > REUSE_GRACE_MS) return false;
    return this.refreshTokenRepository.existsActive(row.replacedById);
  }

  private async insert(trainerId: string) {
    const refreshToken = randomBytes(32).toString('base64url');
    const id = await this.refreshTokenRepository.add({
      trainerId,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return { id, tokens: { accessToken: await this.access(trainerId), refreshToken } };
  }

  async revoke(refreshToken: string | undefined) {
    if (!refreshToken) return;
    await this.refreshTokenRepository.revokeByHash(sha256(refreshToken));
  }

  async revokeAll(trainerId: string) {
    await this.refreshTokenRepository.revokeAllOf(trainerId);
  }

  private access(trainerId: string) {
    return this.jwtService.signAsync({ sub: trainerId });
  }
}
