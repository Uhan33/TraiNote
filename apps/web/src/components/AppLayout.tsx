import { useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Dumbbell, LogOut, Scale, Utensils } from 'lucide-react'
import { NavLink, Outlet, useMatch, useNavigate } from 'react-router'
import { authControllerLogout, useAuthControllerMe } from '@/api/generated'
import ThemeToggle from './ThemeToggle'

const TABS = [
  { to: '/workouts', label: '운동일지', icon: Dumbbell },
  { to: '/homework', label: '숙제', icon: ClipboardCheck },
  { to: '/meals', label: '식단', icon: Utensils },
  { to: '/body', label: '체중', icon: Scale },
]

// 모바일(< lg): 하단 탭 바 / PC(lg 이상): 좌측 사이드바
export default function AppLayout() {
  // 모바일 상세 화면은 전체 화면으로 — 하단 탭 숨김
  const inDetail = !!useMatch('/workouts/:memberId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const me = useAuthControllerMe({ query: { staleTime: Infinity } })

  const logout = async () => {
    await authControllerLogout().catch(() => {}) // 실패해도 화면은 로그아웃 처리
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`flex min-h-dvh lg:h-dvh ${inDetail ? '' : 'pb-[calc(4rem+env(safe-area-inset-bottom))]'} lg:pb-0`}>
      <aside className="hidden w-56 shrink-0 flex-col border-r px-3 py-6 lg:flex">
        <div className="flex items-center justify-between pb-6 pl-3 pr-1">
          <p className="text-xl font-bold">TraiNote</p>
          <ThemeToggle />
        </div>
        <ul className="flex flex-col gap-1">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-lg px-3 ${isActive ? 'bg-muted font-semibold' : 'text-muted-foreground hover:bg-muted/60'}`
                }
              >
                <Icon className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-1">
          <p className="truncate px-3 text-sm font-medium">{me.data?.name}</p>
          <button
            type="button"
            onClick={logout}
            className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted/60"
          >
            <LogOut className="size-4" /> 로그아웃
          </button>
          <p className="px-3 pt-2 text-xs text-muted-foreground">v{__APP_VERSION__}</p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <Outlet />
      </main>

      <nav
        className={`fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden ${inDetail ? 'hidden' : ''}`}
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex h-full flex-col items-center justify-center gap-1 text-xs ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`
                }
              >
                <Icon className="size-6" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export function ComingSoon() {
  return <p className="flex flex-1 items-center justify-center text-muted-foreground">준비 중이에요</p>
}
