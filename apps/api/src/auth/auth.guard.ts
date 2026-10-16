import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export const ACCESS_COOKIE = 'trainote_access';
export const REFRESH_COOKIE = 'trainote_refresh';

type AuthedRequest = Request & { trainerId?: string };

// httpOnly 쿠키의 액세스 토큰(JWT, 15분) 검증 → req.trainerId. 컨트롤러에 @UseGuards(AuthGuard)
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('로그인이 필요합니다');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      req.trainerId = payload.sub;
      return true;
    } catch {
      // 만료 — 프론트가 /api/auth/refresh 후 재시도
      throw new UnauthorizedException('로그인이 만료되었습니다');
    }
  }
}

// AuthGuard 를 거친 요청에서 로그인한 트레이너 id
export const CurrentTrainerId = createParamDecorator(
  (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AuthedRequest>().trainerId!,
);
