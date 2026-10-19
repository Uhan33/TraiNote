import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 홈 화면 앱으로 처음 열 때 한 번 — 알림 동의 (표시 여부·구독은 usePushConsent)
export default function PushConsent({ onDone }: { onDone: (result?: NotificationPermission) => void }) {
  const [busy, setBusy] = useState(false)

  // 허용 창은 버튼을 누른 직후에 바로 띄워야 함 (아이폰)
  const allow = async () => {
    setBusy(true)
    onDone(await Notification.requestPermission().catch(() => undefined))
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 pb-[env(safe-area-inset-bottom)] text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <Bell className="size-9" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">운동일지 알림 받기</h1>
      <p className="mt-2 text-muted-foreground">
        트레이너가 운동일지를 작성하면
        <br />
        바로 알려드려요
      </p>
      <div className="mt-10 flex w-full max-w-xs flex-col gap-2">
        <Button className="h-12 rounded-xl text-base" disabled={busy} onClick={() => void allow()}>
          알림 받기
        </Button>
        <Button variant="ghost" className="h-12 rounded-xl text-base text-muted-foreground" disabled={busy} onClick={() => onDone()}>
          나중에
        </Button>
      </div>
    </div>
  )
}
