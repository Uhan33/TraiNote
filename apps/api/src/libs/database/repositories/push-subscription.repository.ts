import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscription } from '../entities/push-subscription.entity.js';
import { BaseRepository } from './base.repository.js';

@Injectable()
export class PushSubscriptionRepository extends BaseRepository<PushSubscription> {
  constructor(@InjectRepository(PushSubscription) repository: Repository<PushSubscription>) {
    super(repository);
  }

  listByMember(memberId: string) {
    return this.find({ where: { memberId } });
  }

  // 같은 기기(endpoint)면 덮어쓰기 — 한 기기에서 다른 회원 코드로 들어가면 새 회원으로 옮겨짐
  upsertByEndpoint(data: Pick<PushSubscription, 'memberId' | 'endpoint' | 'p256dh' | 'auth'>) {
    return this.upsert(data, ['endpoint']);
  }

  deleteByEndpoint(endpoint: string) {
    return this.delete({ endpoint });
  }

  deleteByMember(memberId: string) {
    return this.delete({ memberId });
  }
}
