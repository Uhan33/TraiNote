import { Bell, ChevronRight, LogOut } from 'lucide-react'
import { Link } from 'react-router'
import ThemeToggle from '@/components/ThemeToggle'
import { pushSupported } from '@/lib/push'
import { isStandalone } from '@/lib/pwa'
import { useMemberLogout, useMemberProfile } from './useMemberProfile'

export default function MemberSettingsPage() {
  const profile = useMemberProfile()
  const logout = useMemberLogout()

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col px-5 pt-6 pb-10 lg:px-8">
      <h1 className="text-2xl font-bold">내 정보</h1>

      <section className="mt-6 rounded-2xl border p-4">
        <p className="text-lg font-semibold">{profile.data?.name}</p>
        <p className="text-sm text-muted-foreground">담당 트레이너 {profile.data?.trainerName}</p>
      </section>

      <section className="mt-4 divide-y rounded-2xl border">
        <div className="flex h-14 items-center justify-between px-4">
          <span>다크 모드</span>
          <ThemeToggle />
        </div>
        {/* 알림은 홈 화면 앱에서만 받을 수 있어 그때만 표시 */}
        {pushSupported && isStandalone() && (
          <Link to="/member/settings/notifications" className="flex h-14 items-center gap-3 px-4 active:bg-muted">
            <Bell className="size-5" />
            <span className="flex-1">알림 설정</span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        )}
        <button type="button" onClick={logout} className="flex h-14 w-full items-center gap-3 px-4 text-left text-destructive active:bg-muted">
          <LogOut className="size-5" /> 나가기
        </button>
      </section>
      <p className="mt-2 px-1 text-xs text-muted-foreground">나가면 이 기기에서 회원 코드를 다시 입력해야 해요</p>

      <p className="mt-6 text-center text-xs text-muted-foreground">TraiNote v{__APP_VERSION__}</p>
    </div>
  )
}
