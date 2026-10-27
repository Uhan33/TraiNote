import { describe, expect, it } from 'vitest';
import { strengthSeries } from './strength.js';

const set = (kg: number | null) => ({ kg, reps: 10, done: true });

describe('strengthSeries', () => {
  it('날짜별 최고 중량, 무게 없는 세트·1일뿐인 종목 제외, 기록 많은 순, 기본 종목에 없으면 부위 null', () => {
    const series = strengthSeries([
      { logDate: '2026-10-01', exercises: [{ name: '스쿼트', sets: [set(60), set(70)] }, { name: '벤치프레스', sets: [set(40)] }, { name: '플랭크', sets: [set(null)] }] },
      { logDate: '2026-10-03', exercises: [{ name: '스쿼트', sets: [set(75)] }, { name: '스쿼트', sets: [set(80)] }, { name: '벤치프레스', sets: [set(45)] }] },
      { logDate: '2026-10-05', exercises: [{ name: '스쿼트', sets: [set(0), set(82.5)] }, { name: '데드리프트', sets: [set(100)] }] },
    ], new Map([['스쿼트', '하체']]));
    expect(series).toEqual([
      { name: '스쿼트', bodyPart: '하체', unit: 'kg', points: [{ date: '2026-10-01', value: 70 }, { date: '2026-10-03', value: 80 }, { date: '2026-10-05', value: 82.5 }] },
      { name: '벤치프레스', bodyPart: null, unit: 'kg', points: [{ date: '2026-10-01', value: 40 }, { date: '2026-10-03', value: 45 }] },
    ]);
  });

  it('kg·lb 섞이면 가장 최근 기록 단위로 환산', () => {
    const series = strengthSeries([
      { logDate: '2026-10-01', exercises: [{ name: '레그 프레스', sets: [set(100)] }] },
      { logDate: '2026-10-03', exercises: [{ name: '레그 프레스', unit: 'lb', sets: [set(250)] }] },
    ], new Map());
    expect(series[0]).toMatchObject({ unit: 'lb', points: [{ date: '2026-10-01', value: 220.5 }, { date: '2026-10-03', value: 250 }] });
  });
});
