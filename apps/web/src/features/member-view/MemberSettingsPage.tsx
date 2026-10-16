import { LogOut } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
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
        <button type="button" onClick={logout} className="flex h-14 w-full items-center gap-3 px-4 text-left text-destructive active:bg-muted">
          <LogOut className="size-5" /> 나가기
        </button>
      </section>
      <p className="mt-2 px-1 text-xs text-muted-foreground">나가면 이 기기에서 회원 코드를 다시 입력해야 해요</p>

      <p className="mt-6 text-center text-xs text-muted-foreground">TraiNote v{__APP_VERSION__}</p>
    </div>
  )
}
