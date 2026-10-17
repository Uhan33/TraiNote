import type { ExerciseDto, SaveWorkoutDto } from '@/api/generated'

// 편집 중 입력값은 문자열(입력칸 그대로), 저장할 때 숫자로 변환
export type FormSet = { kg: string; reps: string; done: boolean }
export type FormExercise = { name: string; sets: FormSet[] }
export type WorkoutForm = { title: string; memo: string; exercises: FormExercise[] }

export const EMPTY_FORM: WorkoutForm = { title: '', memo: '', exercises: [] }

export const toForm = (log: SaveWorkoutDto): WorkoutForm => ({
  title: log.title,
  memo: log.memo,
  exercises: log.exercises.map((e) => ({
    name: e.name,
    sets: e.sets.map((s) => ({ kg: s.kg?.toString() ?? '', reps: s.reps?.toString() ?? '', done: s.done })),
  })),
})

const toNumber = (value: string, integer: boolean) => {
  const n = integer ? Number.parseInt(value, 10) : Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

export const toApi = (form: WorkoutForm): SaveWorkoutDto => ({
  title: form.title,
  memo: form.memo,
  exercises: form.exercises.map((e) => ({
    name: e.name,
    sets: e.sets.map((s) => ({ kg: toNumber(s.kg, false), reps: toNumber(s.reps, true), done: s.done })),
  })),
})

export const EXERCISE_CATALOG: Record<string, string[]> = {
  가슴: ['벤치프레스', '인클라인 벤치프레스', '덤벨 프레스', '체스트 프레스 머신', '펙덱 플라이', '푸시업'],
  등: ['데드리프트', '랫풀다운', '바벨 로우', '시티드 로우', '풀업', '원암 덤벨 로우'],
  하체: ['스쿼트', '레그 프레스', '런지', '레그 익스텐션', '레그 컬', '루마니안 데드리프트', '힙 쓰러스트'],
  어깨: ['오버헤드 프레스', '사이드 레터럴 레이즈', '리어 델트 플라이', '덤벨 숄더 프레스'],
  팔: ['바벨 컬', '덤벨 컬', '해머 컬', '케이블 푸시다운', '라잉 트라이셉스 익스텐션'],
  코어: ['플랭크', '크런치', '행잉 레그 레이즈', '케이블 크런치'],
}

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const todayKey = () => toDateKey(new Date())

export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export const shiftDateKey = (key: string, n: number) => toDateKey(addDays(fromDateKey(key), n))

export const formatDateLabel = (key: string) =>
  fromDateKey(key).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

export const summarize = (exercises: ExerciseDto[]) => ({
  exerciseCount: exercises.length,
  setCount: exercises.reduce((sum, e) => sum + e.sets.length, 0),
})

// 남은 PT 횟수 표시 — 3회 이하면 재등록 시점이라 강조
export const PT_LOW = 3
export const ptLabel = (n: number) => (n > 0 ? `${n}회 남음` : n === 0 ? '모두 사용' : `${-n}회 초과`)
