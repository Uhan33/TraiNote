import { useState } from 'react'
import type { BodyRecordDto } from '@/api/generated'
import { BODY_METRICS, metricPoints, metricSummary, type BodyMetric } from '@/lib/body'
import BodyChart from './BodyChart'

// 항목 전환(체중·체지방률·골격근량) + 시작·현재·변화 요약 + 추이 그래프 (트레이너·회원 공용)
export default function BodyOverview({ records }: { records: BodyRecordDto[] }) {
  const [metric, setMetric] = useState<BodyMetric>('weightKg')
  const { label, unit } = BODY_METRICS.find((m) => m.key === metric)!
  const points = metricPoints(records, metric)
  const summary = metricSummary(points, unit)

  return (
    <section className="rounded-2xl border p-4">
      <div role="tablist" aria-label="항목" className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {BODY_METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={m.key === metric}
            onClick={() => setMetric(m.key)}
            className={`h-9 rounded-lg text-sm transition-colors ${m.key === metric ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {summary && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="시작" value={summary.first} />
          <Stat label="현재" value={summary.last} />
          <Stat label="변화" value={summary.change} />
        </div>
      )}
      <BodyChart points={points} unit={unit} label={label} />
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-2 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-bold">{value}</p>
    </div>
  )
}
