import { ChevronRight, History, LogOut, MessageSquare } from 'lucide-react'
import { Link } from 'react-router'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuthMe } from '@/api/generated'
import { useLogout } from '@/features/auth/useLogout'

export default function SettingsPage() {
  const me = useAuthMe({ query: { staleTime: Infinity } })
  const logout = useLogout()

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col px-5 pt-6 pb-10 lg:px-8">
      <h1 className="text-2xl font-bold">내 정보</h1>

      <section className="mt-6 rounded-2xl border p-4">
        <p className="text-lg font-semibold">{me.data?.name}</p>
        <p className="text-sm text-muted-foreground">아이디 {me.data?.loginId}</p>
        {me.data?.email && <p className="text-sm text-muted-foreground">{me.data.email}</p>}
      </section>

      <section className="mt-4 divide-y rounded-2xl border">
        <div className="flex h-14 items-center justify-between px-4">
          <span>다크 모드</span>
          <ThemeToggle />
        </div>
        <Link to="/settings/inquiry" className="flex h-14 items-center gap-3 px-4 active:bg-muted">
          <MessageSquare className="size-5 text-muted-foreground" /> 문의하기
          <ChevronRight className="ml-auto size-5 text-muted-foreground" />
        </Link>
        <Link to="/settings/inquiries" className="flex h-14 items-center gap-3 px-4 active:bg-muted">
          <History className="size-5 text-muted-foreground" /> 문의 내역
          <ChevronRight className="ml-auto size-5 text-muted-foreground" />
        </Link>
        <button type="button" onClick={logout} className="flex h-14 w-full items-center gap-3 px-4 text-left text-destructive active:bg-muted">
          <LogOut className="size-5" /> 로그아웃
        </button>
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">TraiNote v{__APP_VERSION__}</p>
    </div>
  )
}
