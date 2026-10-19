import { Body, Controller, HttpCode, Put, UseGuards } from '@nestjs/common';
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentTrainerId } from '../auth/auth.guard.js';
import { TrainerPushSubscriptionRepository } from '../libs/database/repositories/trainer-push-subscription.repository.js';
import { PushSubscriptionDto } from './dto.js';
import { PushService } from './push.service.js';

// 트레이너 기기 알림 구독 — 문의 답변·소식, 운영자는 새 문의까지. 공개 키는 GET /member/push-key
@ApiTags('push')
@Controller('push-subscription')
@UseGuards(AuthGuard)
export class PushController {
  constructor(
    private readonly pushService: PushService,
    private readonly trainerPushSubscriptionRepository: TrainerPushSubscriptionRepository,
  ) {}

  // 이 기기 등록 (같은 기기면 덮어쓰기). welcome 이면 확인 알림
  @Put()
  @HttpCode(204)
  @ApiNoContentResponse()
  async subscribe(@CurrentTrainerId() trainerId: string, @Body() { welcome, ...device }: PushSubscriptionDto) {
    await this.trainerPushSubscriptionRepository.upsertByEndpoint({ trainerId, ...device });
    if (welcome) {
      await this.pushService.sendToTrainerDevice(device, { title: '알림이 켜졌어요', body: '문의 답변과 TraiNote 새 소식을 알려드려요', url: '/workouts' });
    }
  }
}
