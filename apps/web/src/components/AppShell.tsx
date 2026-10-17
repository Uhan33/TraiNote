import { LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import InstallHint from './InstallHint'
import type { Tab } from './tabs'
import ThemeToggle from './ThemeToggle'

// 모바일(< md): 하단 탭, 목록↔상세 전환 / 태블릿 세로(md): 하단 탭 + 목록·일지 2단 / PC·태블릿 가로(lg 이상): 사이드바 + 2단
// 트레이너·회원 화면이 함께 쓰는 레이아웃
// inDetail: 모바일 상세 화면은 전체 화면으로 — 하단 탭 숨김 (태블릿부터는 목록과 함께 보이므로 유지)
export default function AppShell({
  tabs,
  userName,
  logoutLabel,
  onLogout,
  inDetail = false,
}: {
  tabs: Tab[]
  userName?: string
  logoutLabel: string
  onLogout: () => void
  inDetail?: boolean
}) {
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
          {tabs.map(({ to, label, icon: Icon }) => (
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
          <p className="truncate px-3 text-sm font-medium">{userName}</p>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted/60"
          >
            <LogOut className="size-4" /> {logoutLabel}
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
        <InstallHint />
        <ul className="mx-auto grid h-16 max-w-md grid-flow-col auto-cols-fr">
          {tabs.map(({ to, label, icon: Icon }) => (
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
