import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

// 서버 상태 확인 (Docker healthcheck·외부 모니터링) — /api/health, 버전 없음
@Controller({ version: VERSION_NEUTRAL })
@SkipThrottle()
export class AppController {
  @Get('health')
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  health() {
    return { status: 'ok' };
  }
}
