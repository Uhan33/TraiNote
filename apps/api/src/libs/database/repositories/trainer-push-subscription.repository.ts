import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainerPushSubscription } from '../entities/trainer-push-subscription.entity.js';
import { BaseRepository } from './base.repository.js';

@Injectable()
export class TrainerPushSubscriptionRepository extends BaseRepository<TrainerPushSubscription> {
  constructor(@InjectRepository(TrainerPushSubscription) repository: Repository<TrainerPushSubscription>) {
    super(repository);
  }

  // 지금 운영자인 트레이너의 기기만 (권한 해제되면 바로 제외)
  listAdmins() {
    return this.find({ where: { trainer: { role: 'admin' } } });
  }

  // 같은 기기(endpoint)면 덮어쓰기
  upsertByEndpoint(data: Pick<TrainerPushSubscription, 'trainerId' | 'endpoint' | 'p256dh' | 'auth'>) {
    return this.upsert(data, ['endpoint']);
  }

  deleteByEndpoint(endpoint: string) {
    return this.delete({ endpoint });
  }
}
