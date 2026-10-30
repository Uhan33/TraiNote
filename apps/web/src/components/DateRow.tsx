import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { fromDateKey } from '@/features/workouts/data'

// 날짜별 기록 한 줄 (회원 운동일지·개인운동 목록 공용) — 날짜·요일, 두 줄 요약, 오른쪽 표시(댓글 수 등), 안 읽음 점
export default function DateRow({
  date,
  primary,
  secondary,
  extra,
  unread = false,
  onOpen,
}: {
  date: string
  primary: ReactNode
  secondary?: ReactNode
  extra?: ReactNode
  unread?: boolean
  onOpen: () => void
}) {
  const d = fromDateKey(date)
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left active:bg-muted md:hover:bg-muted/60">
      <span className="w-14 shrink-0 font-semibold">
        {d.toLocaleDateString('ko-KR', { day: 'numeric' })}
        <span className="block text-xs font-normal text-muted-foreground">{d.toLocaleDateString('ko-KR', { weekday: 'long' })}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{primary}</span>
        {secondary && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{secondary}</span>}
      </span>
      {extra && <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">{extra}</span>}
      {unread && <span aria-label="새 기록" className="size-2 shrink-0 rounded-full bg-red-500" />}
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  )
}
