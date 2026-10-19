import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import { PushSubscriptionRepository } from '../libs/database/repositories/push-subscription.repository.js';
import { TrainerPushSubscriptionRepository } from '../libs/database/repositories/trainer-push-subscription.repository.js';

export type PushPayload = { title: string; body: string; url: string };
type Device = { endpoint: string; p256dh: string; auth: string };

// 웹 푸시 (VAPID) — 브라우저 회사 푸시 서버(Apple·Google 등)로 전달, 비용 없음
// VAPID 키가 없으면(로컬 등) 발송만 건너뜀. 키 만들기: npx web-push generate-vapid-keys (README 배포)
// 발송 실패는 예외를 던지지 않음 (알림 때문에 저장이 실패하면 안 됨)
@Injectable()
export class PushService {
  readonly publicKey = process.env.VAPID_PUBLIC_KEY ?? '';
  private readonly enabled: boolean;
  private readonly logger = new Logger('Push');

  constructor(
    private readonly pushSubscriptionRepository: PushSubscriptionRepository,
    private readonly trainerPushSubscriptionRepository: TrainerPushSubscriptionRepository,
  ) {
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    this.enabled = !!(this.publicKey && privateKey);
    if (this.enabled) webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:typhoid33@naver.com', this.publicKey, privateKey!);
  }

  // 회원의 모든 기기로
  async sendToMember(memberId: string, payload: PushPayload) {
    if (!this.enabled) return;
    const devices = await this.pushSubscriptionRepository.listByMember(memberId);
    await Promise.all(devices.map((d) => this.sendToMemberDevice(d, payload)));
  }

  // 회원 기기 하나로 (알림 허용 확인)
  async sendToMemberDevice(device: Device, payload: PushPayload) {
    if (await this.deliver(device, payload)) await this.pushSubscriptionRepository.deleteByEndpoint(device.endpoint);
  }

  // 트레이너의 모든 기기로
  async sendToTrainer(trainerId: string, payload: PushPayload) {
    if (!this.enabled) return;
    const devices = await this.trainerPushSubscriptionRepository.listByTrainer(trainerId);
    await Promise.all(devices.map((d) => this.sendToTrainerDevice(d, payload)));
  }

  // 운영자(role = admin) 트레이너의 모든 기기로
  async sendToAdmins(payload: PushPayload) {
    if (!this.enabled) return;
    const devices = await this.trainerPushSubscriptionRepository.listAdmins();
    await Promise.all(devices.map((d) => this.sendToTrainerDevice(d, payload)));
  }

  async sendToTrainerDevice(device: Device, payload: PushPayload) {
    if (await this.deliver(device, payload)) await this.trainerPushSubscriptionRepository.deleteByEndpoint(device.endpoint);
  }

  // 발송. true = 앱 삭제·알림 해제된 기기(404·410) → 호출한 쪽에서 구독 정리
  private async deliver({ endpoint, p256dh, auth }: Device, payload: PushPayload) {
    if (!this.enabled) return false;
    try {
      await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(payload), { TTL: 24 * 60 * 60 });
      return false;
    } catch (e) {
      if (e instanceof webpush.WebPushError && (e.statusCode === 404 || e.statusCode === 410)) return true;
      this.logger.warn({ event: 'push_failed', endpoint: new URL(endpoint).host, error: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }
}
