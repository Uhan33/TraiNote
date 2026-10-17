import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { ACCESS_COOKIE, AuthGuard, CurrentTrainerId, REFRESH_COOKIE } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { LoginDto, SignupDto, TrainerDto } from './dto.js';
import { ACCESS_TTL_MS, REFRESH_TTL_MS, TokensService, type Tokens } from './tokens.service.js';

const baseCookie = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  domain: process.env.COOKIE_DOMAIN || undefined,
});
const accessCookie = (): CookieOptions => ({ ...baseCookie(), path: '/' });
// 리프레시 토큰은 인증 API 에만 전송
const refreshCookie = (): CookieOptions => ({ ...baseCookie(), path: '/api/auth' });

// 가입·로그인은 AuthGuard 를 거치지 않으므로 요청 로그(request-log)에 트레이너 ID 를 직접 표시
const markTrainer = (res: Response, trainerId: string) => {
  (res.req as Request & { trainerId?: string }).trainerId = trainerId;
};

@ApiTags('auth')
// 버전 없음(/api/auth) — 리프레시 쿠키 경로가 API 버전과 무관하게 유지되도록
@Controller({ path: 'auth', version: VERSION_NEUTRAL })
// 무차별 대입 방지: 인증 API 는 IP 당 1분 10회
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService,
  ) {}

  @Post('signup')
  @ApiCreatedResponse({ type: TrainerDto })
  @ApiConflictResponse({ description: '아이디 또는 이메일 중복 (field 로 구분)' })
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const trainer = await this.authService.signup(dto);
    this.setCookies(res, await this.tokensService.issue(trainer.id));
    markTrainer(res, trainer.id);
    return trainer;
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: TrainerDto })
  @ApiUnauthorizedResponse()
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const trainer = await this.authService.login(dto);
    this.setCookies(res, await this.tokensService.issue(trainer.id));
    markTrainer(res, trainer.id);
    return trainer;
  }

  // 액세스 토큰 만료 시 호출. 리프레시 토큰도 새로 교체됨
  @Post('refresh')
  @HttpCode(204)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: '리프레시 토큰 없음·만료·재사용 — 다시 로그인' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      this.setCookies(res, await this.tokensService.rotate(req.cookies?.[REFRESH_COOKIE] as string | undefined));
    } catch (e) {
      this.clearCookies(res);
      throw e;
    }
  }

  @Post('logout')
  @HttpCode(204)
  @ApiNoContentResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.tokensService.revoke(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    this.clearCookies(res);
  }

  @Post('logout-all')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  @ApiNoContentResponse({ description: '모든 기기에서 로그아웃' })
  async logoutAll(@CurrentTrainerId() trainerId: string, @Res({ passthrough: true }) res: Response) {
    await this.tokensService.revokeAll(trainerId);
    this.clearCookies(res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: TrainerDto })
  @ApiUnauthorizedResponse()
  me(@CurrentTrainerId() trainerId: string) {
    return this.authService.me(trainerId);
  }

  private setCookies(res: Response, { accessToken, refreshToken }: Tokens) {
    res.cookie(ACCESS_COOKIE, accessToken, { ...accessCookie(), maxAge: ACCESS_TTL_MS });
    if (refreshToken) res.cookie(REFRESH_COOKIE, refreshToken, { ...refreshCookie(), maxAge: REFRESH_TTL_MS });
  }

  private clearCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, accessCookie());
    res.clearCookie(REFRESH_COOKIE, refreshCookie());
  }
}
