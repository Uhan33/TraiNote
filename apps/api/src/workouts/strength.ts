import type { WorkoutLog } from '../libs/database/entities/workout-log.entity.js';
import type { StrengthSeriesDto } from './dto.js';

const LB = 0.45359237; // 1lb = 0.45359237kg

// 종목별 날짜마다 최고 중량 — 무게 없는 세트(맨몸 등)는 제외, 2일 이상 기록된 종목만, 기록 많은 순
// 종목은 이름이 같아야 같은 종목 (직접 입력한 이름은 따로 묶임). 부위는 기본 종목(exercise 테이블)에서, 없으면 null
// 단위는 가장 최근 기록의 단위 — kg·lb 가 섞이면 kg 으로 모아 비교한 뒤 그 단위로 환산 (소수 첫째 자리)
export function strengthSeries(logs: Pick<WorkoutLog, 'logDate' | 'exercises'>[], partByName: Map<string, string>): StrengthSeriesDto[] {
  const byName = new Map<string, { days: Map<string, number>; unit: 'kg' | 'lb'; latest: string }>();
  for (const log of logs) {
    for (const e of log.exercises) {
      const unit = e.unit ?? 'kg';
      const max = Math.max(0, ...e.sets.map((s) => s.kg ?? 0)) * (unit === 'lb' ? LB : 1);
      if (max <= 0) continue;
      const entry = byName.get(e.name) ?? { days: new Map<string, number>(), unit, latest: log.logDate };
      entry.days.set(log.logDate, Math.max(entry.days.get(log.logDate) ?? 0, max));
      if (log.logDate >= entry.latest) Object.assign(entry, { unit, latest: log.logDate });
      byName.set(e.name, entry);
    }
  }
  return [...byName]
    .map(([name, { days, unit }]) => {
      const value = (kg: number) => (unit === 'lb' ? Math.round((kg / LB) * 10) / 10 : Math.round(kg * 100) / 100);
      const points = [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, kg]) => ({ date, value: value(kg) }));
      return { name, bodyPart: partByName.get(name) ?? null, unit, points };
    })
    .filter((s) => s.points.length >= 2)
    .sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name, 'ko'));
}
