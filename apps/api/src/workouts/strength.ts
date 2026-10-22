import type { WorkoutLog } from '../libs/database/entities/workout-log.entity.js';
import type { StrengthSeriesDto } from './dto.js';

// 종목별 날짜마다 최고 중량(kg) — 무게 없는 세트(맨몸 등)는 제외, 2일 이상 기록된 종목만, 기록 많은 순
// 종목은 이름이 같아야 같은 종목 (직접 입력한 이름은 따로 묶임). 부위는 기본 종목(exercise 테이블)에서, 없으면 null
export function strengthSeries(logs: Pick<WorkoutLog, 'logDate' | 'exercises'>[], partByName: Map<string, string>): StrengthSeriesDto[] {
  const byName = new Map<string, Map<string, number>>();
  for (const log of logs) {
    for (const e of log.exercises) {
      const max = Math.max(0, ...e.sets.map((s) => s.kg ?? 0));
      if (max <= 0) continue;
      const days = byName.get(e.name) ?? new Map<string, number>();
      days.set(log.logDate, Math.max(days.get(log.logDate) ?? 0, max));
      byName.set(e.name, days);
    }
  }
  return [...byName]
    .map(([name, days]) => ({ name, bodyPart: partByName.get(name) ?? null, points: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value })) }))
    .filter((s) => s.points.length >= 2)
    .sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name, 'ko'));
}
