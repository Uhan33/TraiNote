import { useInfiniteQuery } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { memberViewWorkouts, type ExerciseDto, type MemberViewWorkoutDto } from '@/api/generated'
import { formatDateLabel, fromDateKey } from '@/features/workouts/data'
import { useMemberProfile } from './useMemberProfile'

const PAGE_SIZE = 10 // API 와 동일

// 회원 운동일지 (/member/workouts) — 읽기 전용
// 트레이너 전용 회원 메모(member.memo)는 API 가 내려주지 않음. 일지 메모는 "트레이너 코멘트"로 노출
export default function MemberWorkoutsPage() {
  const profile = useMemberProfile()
  const logs = useInfiniteQuery({
    queryKey: ['/api/v1/member/me/workouts'],
    queryFn: ({ pageParam }) => memberViewWorkouts(pageParam ? { before: pageParam } : undefined),
    initialPageParam: '',
    // 10개 미만이면 마지막 페이지. 다음 커서 = 이번 페이지 마지막 날짜
    getNextPageParam: (last) => (last.length === PAGE_SIZE ? last.at(-1)?.date : undefined),
  })

  // 목록 끝이 화면에 들어오면 다음 페이지
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = logs
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && !isFetchingNextPage && void fetchNextPage(), {
      rootMargin: '400px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const all = logs.data?.pages.flat() ?? []
  // 월별 묶음 (최신순 유지)
  const months = new Map<string, MemberViewWorkoutDto[]>()
  for (const log of all) months.set(log.date.slice(0, 7), [...(months.get(log.date.slice(0, 7)) ?? []), log])

  return (
    <div className="flex-1 md:overflow-y-auto">
      <div className="mx-auto w-full max-w-xl px-5 pt-6 pb-12">
        <header>
          <h1 className="text-2xl font-bold">운동일지</h1>
          {profile.data && <p className="mt-1 text-sm text-muted-foreground">담당 트레이너 {profile.data.trainerName}</p>}
        </header>

        {profile.data && (
          <section className="mt-6 flex gap-3">
            <Stat label="이번 달 운동" value={`${profile.data.monthCount}회`} />
            <Stat label="전체 기록" value={`${profile.data.totalCount}회`} />
            {profile.data.ptRemaining !== null && <Stat label="남은 PT" value={`${Math.max(0, profile.data.ptRemaining)}회`} />}
          </section>
        )}

        {logs.isSuccess && all.length === 0 && <p className="py-20 text-center text-muted-foreground">아직 기록된 운동이 없어요</p>}

        {[...months].map(([month, items]) => (
          <section key={month} className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {fromDateKey(`${month}-01`).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {items.map((log) => (
                <LogCard key={log.date} log={log} />
              ))}
            </div>
          </section>
        ))}

        <div ref={sentinel} />
        {(logs.isPending || logs.isFetchingNextPage) && <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중…</p>}
        {logs.isError && (
          <button type="button" onClick={() => void logs.refetch()} className="w-full py-6 text-center text-sm text-destructive">
            불러오지 못했어요 · 다시 시도
          </button>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-muted px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-bold">{value}</p>
    </div>
  )
}

function LogCard({ log }: { log: MemberViewWorkoutDto }) {
  return (
    <article className="rounded-2xl border p-4">
      <div className="flex items-baseline gap-2">
        <h3 className="font-semibold">{formatDateLabel(log.date)}</h3>
        {log.title && <span className="text-sm text-muted-foreground">{log.title}</span>}
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {log.exercises.map((exercise, i) => (
          <li key={i} className="flex items-start justify-between gap-4 text-sm">
            <span className="shrink-0 font-medium">{exercise.name}</span>
            <span className="flex flex-col text-right text-muted-foreground">
              {describeSets(exercise).map((line, j) => (
                <span key={j}>{line}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>

      {log.memo && (
        <div className="mt-4 rounded-xl bg-muted p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquare className="size-3.5" /> 트레이너 코멘트
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{log.memo}</p>
        </div>
      )}
    </article>
  )
}

const setText = (weight: number | null, unit: string, reps: number | null) =>
  [weight !== null && `${weight}${unit}`, reps !== null && `${reps}회`].filter(Boolean).join(' × ') || '-'

// 연속으로 같은 세트는 묶어서 한 줄: ["60kg × 10회 · 2세트", "65kg × 8회", "70kg × 6회"]
function describeSets({ sets, unit = 'kg' }: ExerciseDto) {
  const groups: { text: string; count: number }[] = []
  for (const s of sets) {
    const text = setText(s.kg, unit, s.reps)
    const last = groups.at(-1)
    if (last?.text === text) last.count++
    else groups.push({ text, count: 1 })
  }
  return groups.map((g) => (g.count > 1 ? `${g.text} · ${g.count}세트` : g.text))
}
