import { Check, ChevronLeft, History, Minus, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import CopyId from './CopyId'
import DateNav from './DateNav'
import {
  EXERCISE_CATALOG,
  findPreviousWorkout,
  findWorkout,
  formatDateLabel,
  members,
  saveWorkout,
  todayKey,
  workouts,
  type Member,
  type Workout,
  type WorkoutSet,
} from './data'

export default function WorkoutEditPage() {
  const { memberId } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const date = params.get('date') ?? todayKey()
  const member = members.find((m) => m.id === memberId)

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 max-w-2xl items-center gap-1 px-2 lg:px-6">
          <Button variant="ghost" size="icon-lg" aria-label="회원 목록" className="lg:hidden" onClick={() => navigate(`/workouts?date=${date}`)}>
            <ChevronLeft className="size-6" />
          </Button>
          <span className="text-lg font-semibold">{member?.name ?? '회원 없음'}</span>
          {member && <CopyId id={member.id} />}
        </div>
        {member && (
          <div className="max-w-2xl px-3 pb-2 lg:px-5">
            <DateNav
              value={date}
              onChange={(d) => setParams({ date: d }, { replace: true })}
              markedDates={workouts.filter((w) => w.memberId === member.id).map((w) => w.date)}
            />
          </div>
        )}
      </header>

      {/* key: 회원·날짜가 바뀌면 편집 상태를 새로 로드 */}
      {member && <WorkoutEditor key={`${member.id}-${date}`} member={member} date={date} />}
    </div>
  )
}

function WorkoutEditor({ member, date }: { member: Member; date: string }) {
  const [workout, setWorkout] = useState<Workout>(() => {
    const existing = findWorkout(member.id, date)
    return existing ? structuredClone(existing) : { memberId: member.id, date, title: '', memo: '', exercises: [] }
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const previous = workout.exercises.length === 0 ? findPreviousWorkout(member.id, date) : undefined

  // 수정할 때마다 자동 저장
  const update = (fn: (w: Workout) => void) => {
    const next = structuredClone(workout)
    fn(next)
    setWorkout(next)
    saveWorkout(next)
  }

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col gap-6 px-5 pt-5 pb-10 lg:px-8">
        <input
          value={workout.title}
          onChange={(e) => update((w) => void (w.title = e.target.value))}
          placeholder="오늘의 운동 (예: 하체)"
          className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground/50"
        />

        {previous && (
          <button
            type="button"
            onClick={() =>
              update((w) => {
                w.title ||= previous.title
                w.exercises = previous.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: false })) }))
              })
            }
            className="flex items-center gap-3 rounded-2xl border border-dashed p-4 text-left active:bg-muted"
          >
            <History className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">지난 기록 불러오기</span>
              <span className="block truncate text-sm text-muted-foreground">
                {formatDateLabel(previous.date)} · {previous.title || '운동'} · {previous.exercises.map((e) => e.name).join(', ')}
              </span>
            </span>
          </button>
        )}

        {workout.exercises.map((exercise, ei) => (
          <section key={ei} className="rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{exercise.name}</h2>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`${exercise.name} 삭제`}
                onClick={() => update((w) => void w.exercises.splice(ei, 1))}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>

            <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2 text-center">
              <span className="text-xs text-muted-foreground">세트</span>
              <span className="text-xs text-muted-foreground">kg</span>
              <span className="text-xs text-muted-foreground">회</span>
              <span className="text-xs text-muted-foreground">완료</span>
              {exercise.sets.map((set, si) => {
                const patch = (p: Partial<WorkoutSet>) => update((w) => void Object.assign(w.exercises[ei].sets[si], p))
                return <SetRow key={si} index={si} set={set} onChange={patch} />
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="h-10"
                disabled={exercise.sets.length <= 1}
                onClick={() => update((w) => void w.exercises[ei].sets.pop())}
              >
                <Minus /> 세트 삭제
              </Button>
              <Button
                variant="secondary"
                className="h-10"
                onClick={() =>
                  update((w) => {
                    const s = w.exercises[ei].sets
                    // 직전 세트 값을 복사해 입력을 줄임
                    s.push({ ...(s.at(-1) ?? { kg: '', reps: '' }), done: false })
                  })
                }
              >
                <Plus /> 세트 추가
              </Button>
            </div>
          </section>
        ))}

        <Button variant="outline" className="h-12 rounded-xl border-dashed text-base" onClick={() => setPickerOpen(true)}>
          <Plus /> 운동 추가
        </Button>

        <textarea
          value={workout.memo}
          onChange={(e) => update((w) => void (w.memo = e.target.value))}
          placeholder="메모 (컨디션, 느낀 점 등)"
          rows={3}
          className="w-full resize-none rounded-xl border bg-transparent p-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(name) => {
          update((w) => void w.exercises.push({ name, sets: [{ kg: '', reps: '', done: false }] }))
          setPickerOpen(false)
        }}
      />
    </>
  )
}

function SetRow({ index, set, onChange }: { index: number; set: WorkoutSet; onChange: (p: Partial<WorkoutSet>) => void }) {
  return (
    <>
      <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
      <Input
        inputMode="decimal"
        value={set.kg}
        onChange={(e) => onChange({ kg: e.target.value })}
        placeholder="0"
        aria-label={`${index + 1}세트 무게`}
        className="h-11 text-center text-base md:text-base"
      />
      <Input
        inputMode="numeric"
        value={set.reps}
        onChange={(e) => onChange({ reps: e.target.value })}
        placeholder="0"
        aria-label={`${index + 1}세트 횟수`}
        className="h-11 text-center text-base md:text-base"
      />
      <button
        type="button"
        aria-label={`${index + 1}세트 완료`}
        aria-pressed={set.done}
        onClick={() => onChange({ done: !set.done })}
        className={`flex size-11 items-center justify-center rounded-lg border transition-colors ${
          set.done ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground/40'
        }`}
      >
        <Check className="size-5" />
      </button>
    </>
  )
}

function ExercisePicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim()
  const groups = Object.entries(EXERCISE_CATALOG)
    .map(([part, names]) => [part, names.filter((n) => n.includes(q))] as const)
    .filter(([, names]) => names.length > 0)
  const exactMatch = groups.some(([, names]) => names.includes(q))

  return (
    <Drawer open={open} onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setQuery('')
      }}>
      <DrawerContent className="mx-auto h-[85dvh] max-w-md">
        <DrawerHeader>
          <DrawerTitle>운동 추가</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="운동 이름 검색" className="h-11 pl-9 text-base md:text-base" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {q && !exactMatch && (
            <button type="button" onClick={() => onPick(q)} className="flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left active:bg-muted">
              <Plus className="size-4" /> '{q}' 직접 추가
            </button>
          )}
          {groups.map(([part, names]) => (
            <div key={part} className="mt-3">
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{part}</p>
              {names.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onPick(name)}
                  className="flex h-12 w-full items-center rounded-lg px-2 text-left text-base active:bg-muted"
                >
                  {name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
