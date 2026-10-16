import WeightOverview from '@/components/WeightOverview'
import { useMemberViewBodyRecords } from '@/api/generated'
import { formatDateLabel } from '@/features/workouts/data'

// 회원 체중 (/member/body) — 읽기 전용 그래프·기록
export default function MemberBodyPage() {
  const records = useMemberViewBodyRecords()
  const list = [...(records.data ?? [])].reverse()

  return (
    <div className="flex-1 md:overflow-y-auto">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 pt-6 pb-12">
        <h1 className="text-2xl font-bold">체중</h1>
        {records.isPending ? <p className="py-16 text-center text-muted-foreground">불러오는 중…</p> : <WeightOverview records={records.data ?? []} />}
        {list.length > 0 && (
          <ul className="divide-y rounded-2xl border">
            {list.map((r) => (
              <li key={r.date} className="flex h-12 items-center justify-between px-4">
                <span className="text-sm">{formatDateLabel(r.date)}</span>
                <span className="font-semibold">{r.weightKg}kg</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
