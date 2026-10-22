import { useState } from 'react'
import BodyOverview from '@/components/BodyOverview'
import GrowthToggle from '@/components/GrowthToggle'
import StrengthOverview from '@/components/StrengthOverview'
import { CompositionText } from '@/features/body/BodyDetailPage'
import { useMemberViewBodyRecords, useMemberViewStrength } from '@/api/generated'
import { growthView, type GrowthView } from '@/lib/body'
import { formatDateLabel } from '@/features/workouts/data'

// 회원 성장 (/member/body) — 운동(종목별 최고 중량) · 체중(체성분) 읽기 전용 그래프·기록
export default function MemberBodyPage() {
  const strength = useMemberViewStrength()
  const records = useMemberViewBodyRecords()
  const list = [...(records.data ?? [])].reverse()
  const [picked, setPicked] = useState<GrowthView | null>(null)
  const view = growthView(picked, !!strength.data?.length, !!records.data?.length)
  const pending = view === 'strength' ? strength.isPending : records.isPending

  return (
    <div className="flex-1 md:overflow-y-auto">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 pt-6 pb-12">
        <h1 className="text-2xl font-bold">성장</h1>
        <GrowthToggle value={view} onChange={setPicked} />

        {pending ? (
          <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>
        ) : view === 'strength' ? (
          <StrengthOverview series={strength.data ?? []} />
        ) : (
          <>
            <BodyOverview records={records.data ?? []} />
            {list.length > 0 && (
              <ul className="divide-y rounded-2xl border">
                {list.map((r) => (
                  <li key={r.date} className="flex min-h-12 items-center justify-between px-4 py-2">
                    <span className="flex flex-col">
                      <span className="text-sm">{formatDateLabel(r.date)}</span>
                      <CompositionText record={r} />
                    </span>
                    <span className="font-semibold">{r.weightKg}kg</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
