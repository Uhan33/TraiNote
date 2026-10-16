import type { BodyRecordDto } from '@/api/generated'

// 시작·현재·변화량 요약
export function weightSummary(records: BodyRecordDto[]) {
  if (records.length === 0) return null
  const first = records[0].weightKg
  const last = records.at(-1)!.weightKg
  const change = Math.round((last - first) * 100) / 100
  return { first, last, change, changeText: `${change > 0 ? '+' : ''}${change}kg` }
}
