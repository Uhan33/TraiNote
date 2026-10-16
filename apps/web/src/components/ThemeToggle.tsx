import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'

// 초기 테마(저장값 → 없으면 OS 설정)는 index.html 인라인 스크립트가 깜빡임 없이 적용
export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // 저장 불가(사파리 개인정보 보호 모드 등) — 이번 세션에만 적용
    }
    setDark(next)
  }

  // 해·달 둘 다 보이는 스위치 — 현재 모드 쪽 아이콘 아래로 동그라미가 이동
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="다크 모드"
      onClick={toggle}
      className="relative flex h-8 w-16 shrink-0 items-center rounded-full bg-muted p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        className={`absolute top-1 left-1 size-6 rounded-full bg-background shadow-sm transition-transform ${dark ? 'translate-x-8' : ''}`}
      />
      <Sun className={`relative z-10 mx-1 size-4 ${dark ? 'text-muted-foreground' : 'text-foreground'}`} />
      <Moon className={`relative z-10 mx-1 ml-auto size-4 ${dark ? 'text-foreground' : 'text-muted-foreground'}`} />
    </button>
  )
}
