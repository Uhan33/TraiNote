import type { BodyRecordDto } from '@/api/generated'
import { weightSummary } from '@/lib/weight'
import WeightChart from './WeightChart'

// 시작·현재·변화 요약 + 추이 그래프 (트레이너·회원 공용)
export default function WeightOverview({ records }: { records: BodyRecordDto[] }) {
  const summary = weightSummary(records)
  return (
    <section className="rounded-2xl border p-4">
      {summary && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="시작" value={`${summary.first}kg`} />
          <Stat label="현재" value={`${summary.last}kg`} />
          <Stat label="변화" value={summary.changeText} />
        </div>
      )}
      <WeightChart records={records} />
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
