import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { RefreshTokenRepository } from '../libs/database/repositories/refresh-token.repository.js';

export const ACCESS_TTL_MS = 15 * 60 * 1000; // 15분
// 90일, 사용할 때마다 연장. 토큰 값은 바꾸지 않음 — iOS 홈 화면 앱이 Safari 쿠키를 복사해 같은 토큰을 함께 쓰므로
// 교체하면 한쪽이 로그아웃됨. httpOnly 쿠키라 스크립트로 못 읽음. 기기 분실 시 POST /api/auth/logout-all 로 폐기 (화면 버튼은 아직 없음)
export const REFRESH_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export type Tokens = { accessToken: string; refreshToken: string };

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class TokensService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async issue(trainerId: string): Promise<Tokens> {
    const refreshToken = randomBytes(32).toString('base64url');
    await this.refreshTokenRepository.add({ trainerId, tokenHash: sha256(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });
    return { accessToken: await this.access(trainerId), refreshToken };
  }

  // 액세스 토큰 재발급 + 리프레시 토큰 만료 연장 (같은 값 그대로 쿠키 maxAge 갱신)
  async refresh(refreshToken: string | undefined): Promise<Tokens> {
    const row = refreshToken && (await this.refreshTokenRepository.findByHash(sha256(refreshToken)));
    if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException('로그인이 만료되었습니다');
    await this.refreshTokenRepository.extend(row.id, new Date(Date.now() + REFRESH_TTL_MS));
    return { accessToken: await this.access(row.trainerId), refreshToken };
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
