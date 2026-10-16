import { ClipboardCheck, Dumbbell, LogOut, Scale, UserRound, Utensils } from 'lucide-react'
import { NavLink, Outlet, useMatch } from 'react-router'
import { useAuthMe } from '@/api/generated'
import { useLogout } from '@/features/auth/useLogout'
import ThemeToggle from './ThemeToggle'

const TABS = [
  { to: '/workouts', label: '운동일지', icon: Dumbbell },
  { to: '/homework', label: '숙제', icon: ClipboardCheck },
  { to: '/meals', label: '식단', icon: Utensils },
  { to: '/body', label: '체중', icon: Scale },
  { to: '/settings', label: '내 정보', icon: UserRound },
]

// 모바일(< md): 하단 탭, 목록↔상세 전환 / 태블릿 세로(md): 하단 탭 + 목록·일지 2단 / PC·태블릿 가로(lg 이상): 사이드바 + 2단
export default function AppLayout() {
  // 모바일 상세 화면은 전체 화면으로 — 하단 탭 숨김 (태블릿부터는 목록과 함께 보이므로 유지)
  const inDetail = !!useMatch('/workouts/:memberId')
  const me = useAuthMe({ query: { staleTime: Infinity } })
  const logout = useLogout()

  return (
    <div
      className={`flex min-h-dvh md:h-dvh ${inDetail ? 'md:pb-[calc(4rem+env(safe-area-inset-bottom))]' : 'pb-[calc(4rem+env(safe-area-inset-bottom))]'} lg:pb-0`}
    >
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

      <main className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        <Outlet />
      </main>

      <nav
        className={`fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden ${inDetail ? 'hidden md:block' : ''}`}
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
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
