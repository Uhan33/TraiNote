import { useState } from 'react'
import type { StrengthSeriesDto } from '@/api/generated'
import { partRank } from '@/features/workouts/data'
import { metricSummary } from '@/lib/body'
import BodyChart from './BodyChart'
import { Stat } from './BodyOverview'

const OTHER = '기타' // 기본 종목에 없는 이름(직접 입력)

// 부위 → 종목 고르기 + 시작·현재·변화 요약 + 최고 중량 추이 그래프 (BodyOverview 의 운동 버전)
export default function StrengthOverview({ series }: { series: StrengthSeriesDto[] }) {
  const [name, setName] = useState<string | null>(null)
  const current = series.find((s) => s.name === name) ?? series[0]

  if (!current) {
    return (
      <section className="rounded-2xl border p-4">
        <p className="py-16 text-center text-sm text-muted-foreground">
          같은 운동을 두 번 이상 기록하면
          <br />
          무게가 어떻게 늘었는지 그래프로 보여드려요
        </p>
      </section>
    )
  }

  // 부위 순서는 운동 추가 창과 같게, 기타는 맨 뒤. 부위 안 종목은 기록 많은 순(서버 정렬 그대로)
  const partOf = (s: StrengthSeriesDto) => s.bodyPart ?? OTHER
  const parts = [...new Set(series.map(partOf))].sort(
    (a, b) => Number(a === OTHER) - Number(b === OTHER) || partRank(a) - partRank(b) || a.localeCompare(b, 'ko'),
  )
  const part = partOf(current)
  const summary = metricSummary(current.points, 'kg')!

  return (
    <section className="rounded-2xl border p-4">
      <div role="tablist" aria-label="부위" className="-mx-4 flex gap-4 overflow-x-auto border-b px-4 [scrollbar-width:none]">
        {parts.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={p === part}
            onClick={() => setName(series.find((s) => partOf(s) === p)!.name)}
            className={`-mb-px h-10 shrink-0 border-b-2 text-sm transition-colors ${p === part ? 'border-foreground font-semibold' : 'border-transparent text-muted-foreground'}`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="-mx-4 mt-3 mb-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {series
          .filter((s) => partOf(s) === part)
          .map((s) => (
            <button
              key={s.name}
              type="button"
              aria-pressed={s === current}
              onClick={() => setName(s.name)}
              className={`h-9 shrink-0 rounded-full border px-3.5 text-sm transition-colors ${s === current ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground'}`}
            >
              {s.name}
            </button>
          ))}
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="시작" value={summary.first} />
        <Stat label="현재" value={summary.last} />
        <Stat label="변화" value={summary.change} />
      </div>
      <BodyChart points={current.points} unit="kg" label={`${current.name} 최고 중량`} />
      <p className="mt-2 text-center text-xs text-muted-foreground">날짜별 최고 중량</p>
    </section>
  )
}
