import { BellOff, BellRing, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { isStandalone } from '@/lib/pwa'
import { markAsked, pushSupported, subscribe } from './usePushConsent'

// 회원 내 정보 > 알림 설정 (홈 화면 앱에서만 메뉴 노출)
// 알림을 끄거나 차단을 푸는 건 웹에서 할 수 없어 휴대폰 설정으로 안내
export default function MemberNotificationsPage() {
  const navigate = useNavigate()
  const available = pushSupported && isStandalone()
  const [permission, setPermission] = useState<NotificationPermission>(available ? Notification.permission : 'denied')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // 허용 창은 버튼을 누른 직후에 바로 띄워야 함 (아이폰)
  const allow = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await Notification.requestPermission()
      markAsked()
      setPermission(result)
      if (result === 'granted') await subscribe()
    } catch {
      setError('알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col">
      <header className="flex h-14 items-center gap-1 border-b px-2 lg:px-6">
        <Button variant="ghost" size="icon-lg" aria-label="내 정보" onClick={() => navigate('/member/settings')}>
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="text-lg font-semibold">알림 설정</h1>
      </header>

      <div className="flex flex-col gap-3 px-5 pt-6 pb-10 lg:px-8">
        <section className="flex items-start gap-3 rounded-2xl border p-4">
          {permission === 'granted' ? <BellRing className="mt-0.5 size-5 shrink-0" /> : <BellOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">운동일지 알림</p>
            <p className="text-sm text-muted-foreground">
              {!available
                ? '홈 화면에 추가한 앱에서만 알림을 받을 수 있어요'
                : permission === 'granted'
                  ? '알림을 받고 있어요. 트레이너가 운동일지를 작성하면 알려드려요'
                  : permission === 'denied'
                    ? '알림이 차단돼 있어요. 휴대폰 설정 > 알림 > TraiNote 에서 허용해 주세요'
                    : '트레이너가 운동일지를 작성하면 알려드려요'}
            </p>
          </div>
        </section>
        {available && permission === 'default' && (
          <Button className="h-12 rounded-xl text-base" disabled={busy} onClick={() => void allow()}>
            알림 받기
          </Button>
        )}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        {available && permission === 'granted' && (
          <p className="px-1 text-xs text-muted-foreground">알림을 끄려면 휴대폰 설정 &gt; 알림 &gt; TraiNote 에서 꺼 주세요</p>
        )}
      </div>
    </div>
  )
}
