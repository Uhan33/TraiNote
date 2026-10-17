import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { TrainerRepository } from '../libs/database/repositories/trainer.repository.js';

// 운영자 전용 API — AuthGuard 다음에 사용: @UseGuards(AuthGuard, AdminGuard)
// 권한은 토큰에 담지 않고 매 요청 DB 확인 → 해제하면 즉시 반영
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly trainerRepository: TrainerRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { trainerId } = context.switchToHttp().getRequest<Request & { trainerId?: string }>();
    const trainer = trainerId ? await this.trainerRepository.findById(trainerId) : null;
    if (trainer?.role !== 'admin') throw new ForbiddenException('권한이 없습니다');
    return true;
  }
}
