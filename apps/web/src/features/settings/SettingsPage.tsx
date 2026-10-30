import { Bell, ChevronRight, History, Inbox, LogOut, Megaphone, MessageSquare } from 'lucide-react'
import { Link } from 'react-router'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuthMe, useNoticesList } from '@/api/generated'
import { useLogout } from '@/features/auth/useLogout'
import { pushSupported } from '@/lib/push'
import { isStandalone } from '@/lib/pwa'

export default function SettingsPage() {
  const me = useAuthMe({ query: { staleTime: Infinity } })
  const logout = useLogout()
  const notices = useNoticesList()
  const unreadNotices = notices.data?.filter((n) => !n.read).length ?? 0

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col px-5 pt-6 pb-10 lg:px-8">
      <h1 className="text-2xl font-bold">내 정보</h1>

      <section className="mt-6 rounded-2xl border p-4">
        <p className="text-lg font-semibold">{me.data?.name}</p>
        <p className="text-sm text-muted-foreground">아이디 {me.data?.loginId}</p>
        {me.data?.email && <p className="text-sm text-muted-foreground">{me.data.email}</p>}
      </section>

      {/* 운영자(trainer.role = admin)에게만 보이는 메뉴 — 실제 권한 확인은 서버 */}
      {me.data?.role === 'admin' && (
        <section className="mt-4 rounded-2xl border">
          <Link to="/settings/admin/inquiries" className="flex h-14 items-center gap-3 px-4 active:bg-muted">
            <Inbox className="size-5 text-muted-foreground" /> 문의 관리 <span className="text-xs text-muted-foreground">운영자</span>
            <ChevronRight className="ml-auto size-5 text-muted-foreground" />
          </Link>
        </section>
      )}

      <section className="mt-4 divide-y rounded-2xl border">
        <div className="flex h-14 items-center justify-between px-4">
          <span>다크 모드</span>
          <ThemeToggle />
        </div>
        {/* 알림은 홈 화면 앱에서만 받을 수 있어 그때만 표시 */}
        {pushSupported && isStandalone() && (
          <Link to="/settings/notifications" className="flex h-14 items-center gap-3 px-4 active:bg-muted">
            <Bell className="size-5 text-muted-foreground" /> 알림 설정
            <ChevronRight className="ml-auto size-5 text-muted-foreground" />
          </Link>
        )}
        <Link to="/settings/notices" className="flex h-14 items-center gap-3 px-4 active:bg-muted">
          <Megaphone className="size-5 text-muted-foreground" /> 공지사항
          <span className="ml-auto" />
          {unreadNotices > 0 && (
            <span aria-label={`안 읽은 공지 ${unreadNotices}개`} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
              {unreadNotices}
            </span>
          )}
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
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
