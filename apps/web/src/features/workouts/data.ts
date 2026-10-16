// ponytail: 화면 확인용 목업 저장소(메모리). API 연결 시 orval 생성 훅으로 교체
export type WorkoutSet = { kg: string; reps: string; done: boolean }
export type Exercise = { name: string; sets: WorkoutSet[] }
export type Workout = {
  memberId: string
  date: string // YYYY-MM-DD, 회원·날짜당 일지 1개
  title: string
  memo: string
  exercises: Exercise[]
}
export type Member = { id: string; name: string } // id: 6자리 영대문자·숫자

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

export const summarize = (w: Workout) => {
  const sets = w.exercises.flatMap((e) => e.sets)
  const volume = sets.reduce((sum, s) => sum + (Number(s.kg) || 0) * (Number(s.reps) || 0), 0)
  return { exerciseCount: w.exercises.length, setCount: sets.length, volume }
}

export const members: Member[] = [
  { id: 'K7Q2XA', name: '김민지' },
  { id: '3NB8RD', name: '박서준' },
  { id: 'W5T1HM', name: '이하은' },
  { id: 'P9C4EZ', name: '정도윤' },
  { id: 'J2L6VU', name: '최수아' },
]

const sets = (kg: number, reps: number, count: number): WorkoutSet[] =>
  Array.from({ length: count }, () => ({ kg: String(kg), reps: String(reps), done: true }))

const day = (n: number) => toDateKey(addDays(new Date(), n))

const LOWER: Exercise[] = [
  { name: '스쿼트', sets: sets(60, 10, 4) },
  { name: '레그 프레스', sets: sets(120, 12, 3) },
  { name: '레그 컬', sets: sets(30, 15, 3) },
]
const CHEST: Exercise[] = [
  { name: '벤치프레스', sets: sets(40, 10, 4) },
  { name: '덤벨 프레스', sets: sets(14, 12, 3) },
  { name: '케이블 푸시다운', sets: sets(20, 15, 3) },
]

export const workouts: Workout[] = [
  { memberId: 'K7Q2XA', date: day(0), title: '하체', memo: '', exercises: structuredClone(LOWER) },
  { memberId: 'K7Q2XA', date: day(-3), title: '하체', memo: '스쿼트 마지막 세트 무릎 모임 주의', exercises: structuredClone(LOWER) },
  { memberId: 'K7Q2XA', date: day(-7), title: '가슴 · 삼두', memo: '', exercises: structuredClone(CHEST) },
  { memberId: '3NB8RD', date: day(0), title: '가슴 · 삼두', memo: '', exercises: structuredClone(CHEST) },
  { memberId: '3NB8RD', date: day(-2), title: '하체', memo: '', exercises: structuredClone(LOWER) },
  { memberId: 'W5T1HM', date: day(-1), title: '하체', memo: '', exercises: structuredClone(LOWER) },
]

export const findWorkout = (memberId: string, date: string) =>
  workouts.find((w) => w.memberId === memberId && w.date === date)

// 해당 날짜 이전 가장 최근 일지 — "지난 기록 불러오기" 용
export const findPreviousWorkout = (memberId: string, date: string) =>
  workouts
    .filter((w) => w.memberId === memberId && w.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))[0]

export const saveWorkout = (w: Workout) => {
  const i = workouts.findIndex((x) => x.memberId === w.memberId && x.date === w.date)
  if (i >= 0) workouts.splice(i, 1)
  // 운동이 하나도 없으면 일지 없음으로 취급
  if (w.exercises.length > 0) workouts.push(w)
}

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// 6자리 영문·숫자 ID. 대소문자 구분 없음 → 대문자로 통일
// ponytail: 중복은 목업 목록에서만 확인. API 연결 시 DB unique 제약 + 충돌 시 재생성으로 보장
export const generateMemberId = () => {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    const id = Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join('')
    if (!members.some((m) => m.id === id)) return id
  }
}

export const addMember = (name: string) => {
  const member = { id: generateMemberId(), name }
  members.push(member)
  return member
}
