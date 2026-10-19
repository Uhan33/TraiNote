import { useEffect, useState } from 'react'
import { memberViewPushKey, type PushSubscriptionDto } from '@/api/generated'
import { isStandalone } from './pwa'

// 웹 푸시 — 회원(운동일지 알림)·트레이너(문의 답변·소식, 운영자는 새 문의) 공용
// 아이폰은 홈 화면 앱(iOS 16.4+)에서만 PushManager 가 있음
export const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

type Device = Pick<PushSubscriptionDto, 'endpoint' | 'p256dh' | 'auth'>

// 회원·트레이너별: 첫 실행 동의 화면을 보여줬는지 기록하는 키 + 서버 등록 API
export type PushAudience = { askedKey: string; register: (device: Device, welcome: boolean) => Promise<void> }

// VAPID 공개 키(base64url) → 바이트 (Safari 는 문자열 키를 받지 않음)
const toBytes = (base64url: string) => Uint8Array.from(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

// 이 기기의 푸시 구독 (없으면 새로 구독). 서버에 알림 설정이 없으면 null
// 한 기기(서비스 워커)에 구독은 하나 — 회원·트레이너가 같은 구독을 각자 서버에 등록
async function pushDevice(): Promise<Device | null> {
  const { publicKey } = await memberViewPushKey()
  if (!publicKey) return null
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) }))
  const { endpoint, keys } = subscription.toJSON()
  return { endpoint: endpoint!, p256dh: keys!.p256dh, auth: keys!.auth }
}

// 서버에 이 기기 등록. welcome: 방금 허용함 — 서버가 이 기기로 "알림이 켜졌어요" 확인 알림
export async function subscribe(audience: PushAudience, welcome = false) {
  const device = await pushDevice()
  if (device) await audience.register(device, welcome)
}

export function markAsked(audience: PushAudience) {
  try {
    localStorage.setItem(audience.askedKey, '1')
  } catch {
    // 저장 안 되는 환경 — 다음에 다시 물어봄
  }
}

const readAsked = (audience: PushAudience) => {
  try {
    return localStorage.getItem(audience.askedKey) === '1'
  } catch {
    return false
  }
}

// 홈 화면 앱으로 처음 열 때 한 번 동의 화면을 보여줄지 + 이미 허용된 기기는 열 때마다 재등록
// (코드 재발급·다른 계정으로 들어온 뒤에도 계속 받게)
export function usePushConsent(audience: PushAudience) {
  const [permission, setPermission] = useState<NotificationPermission>(pushSupported ? Notification.permission : 'denied')
  const [asked, setAsked] = useState(() => readAsked(audience))
  const [initialPermission] = useState(permission)

  // 이미 허용돼 있던 기기만 (방금 허용한 경우는 finish 에서 확인 알림과 함께 등록)
  useEffect(() => {
    if (initialPermission === 'granted') subscribe(audience).catch(() => {})
  }, [initialPermission, audience])

  const finish = (result?: NotificationPermission) => {
    markAsked(audience)
    setAsked(true)
    if (result) setPermission(result)
    if (result === 'granted') subscribe(audience, true).catch(() => {})
  }

  return { show: pushSupported && isStandalone() && permission === 'default' && !asked, finish }
}
