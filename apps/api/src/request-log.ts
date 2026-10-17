import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

// 가드가 붙여 주는 요청자 정보 (AuthGuard: trainerId, MemberAuthGuard: member)
type LoggedRequest = Request & { trainerId?: string; member?: { id: string } };

// API 요청 1건당 로그 1줄 — 응답이 끝난 뒤 기록해야 가드가 확인한 요청자 ID 를 알 수 있음
// 회원 코드는 로그인 수단(비밀번호 격)이라 남기지 않고 내부 회원 ID 만 기록
export function requestLog(req: LoggedRequest, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    if (req.originalUrl === '/api/health') return; // Docker healthcheck(10초마다) 제외
    logger.log({
      at: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }), // 2026-10-17 14:23:17 (한국 시간)
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Math.round(Number(process.hrtime.bigint() - start) / 1e6),
      ip: req.ip,
      ua: req.get('user-agent') ?? '',
      ...(req.trainerId && { trainerId: req.trainerId }),
      ...(req.member && { memberId: req.member.id }),
    });
  });
  next();
}
