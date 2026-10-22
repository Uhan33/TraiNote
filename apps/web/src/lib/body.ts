import type { BodyRecordDto } from '@/api/generated'

export type BodyMetric = 'weightKg' | 'bodyFatPct' | 'skeletalMuscleKg'

export const BODY_METRICS: { key: BodyMetric; label: string; unit: string }[] = [
  { key: 'weightKg', label: '체중', unit: 'kg' },
  { key: 'bodyFatPct', label: '체지방률', unit: '%' },
  { key: 'skeletalMuscleKg', label: '골격근량', unit: 'kg' },
]

export type MetricPoint = { date: string; value: number }

// 선택 항목만 뽑기 (값이 없는 날은 제외)
export const metricPoints = (records: BodyRecordDto[], key: BodyMetric): MetricPoint[] =>
  records.flatMap((r) => (r[key] === null ? [] : [{ date: r.date, value: r[key] }]))

// 시작·현재·변화 요약
export function metricSummary(points: MetricPoint[], unit: string) {
  if (points.length === 0) return null
  const first = points[0].value
  const last = points.at(-1)!.value
  const change = Math.round((last - first) * 100) / 100
  // 비율의 변화는 %p (예: 27.5% → 23.4% = -4.1%p)
  const changeUnit = unit === '%' ? '%p' : unit
  return { first: `${first}${unit}`, last: `${last}${unit}`, change: `${change > 0 ? '+' : ''}${change}${changeUnit}` }
}

export type GrowthView = 'strength' | 'body'

// 성장 화면 첫 보기 — 고르기 전(picked null)에는 운동 그래프가 있으면 운동, 없고 체중 기록만 있으면 체중
export const growthView = (picked: GrowthView | null, hasStrength: boolean, hasBody: boolean): GrowthView =>
  picked ?? (!hasStrength && hasBody ? 'body' : 'strength')
