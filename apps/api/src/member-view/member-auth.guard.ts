import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { IsNull, Repository } from 'typeorm';
import { Member } from '../members/member.entity.js';

export const MEMBER_COOKIE = 'trainote_member';

export type MemberTokenPayload = { sub: string; typ: 'member'; cia: number };

type MemberRequest = Request & { member?: Member };

// 회원 토큰 검증 + 매 요청 DB 확인: 삭제(연결 해제)됐거나 코드가 재발급됐으면 무효
@Injectable()
export class MemberAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(Member) private readonly members: Repository<Member>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<MemberRequest>();
    const token = req.cookies?.[MEMBER_COOKIE] as string | undefined;
    const payload = token ? await this.jwt.verifyAsync<MemberTokenPayload>(token).catch(() => null) : null;
    const member =
      payload?.typ === 'member'
        ? await this.members.findOne({ where: { id: payload.sub, disconnectedAt: IsNull() }, relations: { trainer: true } })
        : null;
    if (!member || member.codeIssuedAt.getTime() !== payload!.cia) throw new UnauthorizedException('회원 코드를 다시 입력해 주세요');
    req.member = member;
    return true;
  }
}

export const CurrentMember = createParamDecorator(
  (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<MemberRequest>().member!,
);
