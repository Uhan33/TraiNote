import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import type { PushSubscription } from '../libs/database/entities/push-subscription.entity.js';
import { PushSubscriptionRepository } from '../libs/database/repositories/push-subscription.repository.js';

export type PushPayload = { title: string; body: string; url: string };

// 웹 푸시 (VAPID) — 브라우저 회사 푸시 서버(Apple·Google 등)로 전달, 비용 없음
// VAPID 키가 없으면(로컬 등) 발송만 건너뜀. 키 만들기: npx web-push generate-vapid-keys (README 배포)
@Injectable()
export class PushService {
  readonly publicKey = process.env.VAPID_PUBLIC_KEY ?? '';
  private readonly enabled: boolean;
  private readonly logger = new Logger('Push');

  constructor(private readonly pushSubscriptionRepository: PushSubscriptionRepository) {
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    this.enabled = !!(this.publicKey && privateKey);
    if (this.enabled) webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:typhoid33@naver.com', this.publicKey, privateKey!);
  }

  // 회원의 모든 기기로 발송
  async sendToMember(memberId: string, payload: PushPayload) {
    if (!this.enabled) return;
    const subscriptions = await this.pushSubscriptionRepository.listByMember(memberId);
    await Promise.all(subscriptions.map((subscription) => this.send(subscription, payload)));
  }

  // 기기 하나로 발송. 실패해도 예외를 던지지 않음 (알림 때문에 저장이 실패하면 안 됨)
  async send({ endpoint, p256dh, auth }: Pick<PushSubscription, 'endpoint' | 'p256dh' | 'auth'>, payload: PushPayload) {
    if (!this.enabled) return;
    try {
      await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(payload), { TTL: 24 * 60 * 60 });
    } catch (e) {
      // 404·410 = 앱 삭제·알림 해제된 기기 → 구독 정리
      if (e instanceof webpush.WebPushError && (e.statusCode === 404 || e.statusCode === 410)) {
        await this.pushSubscriptionRepository.deleteByEndpoint(endpoint);
      } else {
        this.logger.warn({ event: 'push_failed', endpoint: new URL(endpoint).host, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }
}
