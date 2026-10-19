import { useEffect, useState } from 'react'
import { memberViewPushKey, memberViewSubscribePush } from '@/api/generated'
import { isStandalone } from '@/lib/pwa'

// 회원 운동일지 알림 — 홈 화면 앱(PWA)으로 처음 열 때 한 번 동의 화면.
// 아이폰은 홈 화면 앱(iOS 16.4+)에서만 PushManager 가 있음

const ASKED_KEY = 'pushConsentAsked'
export const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const markAsked = () => {
  try {
    localStorage.setItem(ASKED_KEY, '1')
  } catch {
    // 저장 안 되는 환경 — 다음에 다시 물어봄
  }
}

const readAsked = () => {
  try {
    return localStorage.getItem(ASKED_KEY) === '1'
  } catch {
    return false
  }
}

// VAPID 공개 키(base64url) → 바이트 (Safari 는 문자열 키를 받지 않음)
const toBytes = (base64url: string) => Uint8Array.from(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

// 이 기기를 알림 구독하고 서버에 등록 (이미 구독돼 있으면 다시 등록만)
// welcome: 방금 허용함 — 서버가 이 기기로 "알림이 켜졌어요" 확인 알림
export async function subscribe(welcome = false) {
  const { publicKey } = await memberViewPushKey()
  if (!publicKey) return
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) }))
  const { endpoint, keys } = subscription.toJSON()
  await memberViewSubscribePush({ endpoint: endpoint!, p256dh: keys!.p256dh, auth: keys!.auth, welcome })
}

// 동의 화면을 보여줄지 + 허용된 기기는 열 때마다 구독 재등록 (코드 재발급·다른 회원 코드로 입장한 뒤에도 계속 받게)
export function usePushConsent() {
  const [permission, setPermission] = useState<NotificationPermission>(pushSupported ? Notification.permission : 'denied')
  const [asked, setAsked] = useState(readAsked)
  const [initialPermission] = useState(permission)

  // 이미 허용돼 있던 기기만 (방금 허용한 경우는 finish 에서 확인 알림과 함께 등록)
  useEffect(() => {
    if (initialPermission === 'granted') subscribe().catch(() => {})
  }, [initialPermission])

  const finish = (result?: NotificationPermission) => {
    markAsked()
    setAsked(true)
    if (result) setPermission(result)
    if (result === 'granted') subscribe(true).catch(() => {})
  }

  return { show: pushSupported && isStandalone() && permission === 'default' && !asked, finish }
}
