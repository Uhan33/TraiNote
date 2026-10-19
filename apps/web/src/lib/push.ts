import { memberViewPushKey, type PushSubscriptionDto } from '@/api/generated'

// 웹 푸시 — 회원 운동일지 알림·운영자 새 문의 알림 공용
// 아이폰은 홈 화면 앱(iOS 16.4+)에서만 PushManager 가 있음
export const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// VAPID 공개 키(base64url) → 바이트 (Safari 는 문자열 키를 받지 않음)
const toBytes = (base64url: string) => Uint8Array.from(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

// 이 기기의 푸시 구독 (없으면 새로 구독). 서버에 알림 설정이 없으면 null
// 한 기기(서비스 워커)에 구독은 하나 — 회원·운영자 알림이 같은 구독을 각자 서버에 등록
export async function pushDevice(): Promise<Pick<PushSubscriptionDto, 'endpoint' | 'p256dh' | 'auth'> | null> {
  const { publicKey } = await memberViewPushKey()
  if (!publicKey) return null
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) }))
  const { endpoint, keys } = subscription.toJSON()
  return { endpoint: endpoint!, p256dh: keys!.p256dh, auth: keys!.auth }
}
