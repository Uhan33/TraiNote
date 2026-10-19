import { useEffect, useState } from 'react'
import { memberViewSubscribePush } from '@/api/generated'
import { pushDevice, pushSupported } from '@/lib/push'
import { isStandalone } from '@/lib/pwa'

// 회원 운동일지 알림 — 홈 화면 앱(PWA)으로 처음 열 때 한 번 동의 화면.

const ASKED_KEY = 'pushConsentAsked'

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

// 이 기기를 회원 알림으로 서버에 등록 (이미 구독돼 있으면 다시 등록만)
// welcome: 방금 허용함 — 서버가 이 기기로 "알림이 켜졌어요" 확인 알림
export async function subscribe(welcome = false) {
  const device = await pushDevice()
  if (device) await memberViewSubscribePush({ ...device, welcome })
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
