import type { ExerciseCatalogDto, ExerciseDto, SaveWorkoutDto } from '@/api/generated'

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

// 종목 목록은 DB(GET /exercises) — 부위 순서는 여기, 목록에 없는 새 부위는 맨 뒤. 부위 안에서는 가나다순
const BODY_PARTS = ['가슴', '등', '하체', '어깨', '팔', '코어']
export const partRank = (part: string) => (BODY_PARTS.includes(part) ? BODY_PARTS.indexOf(part) : BODY_PARTS.length)

export const groupExercises = (exercises: ExerciseCatalogDto[]): [string, string[]][] => {
  const groups = new Map<string, string[]>()
  for (const e of exercises) groups.set(e.bodyPart, [...(groups.get(e.bodyPart) ?? []), e.name])
  return [...groups]
    .sort(([a], [b]) => partRank(a) - partRank(b) || a.localeCompare(b, 'ko'))
    .map(([part, names]) => [part, names.sort((x, y) => x.localeCompare(y, 'ko'))])
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
