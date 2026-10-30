import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  memberViewPersonalWorkouts,
  memberViewRemovePersonalWorkout,
  memberViewSavePersonalWorkout,
  useMemberViewCustomExercises,
  useMemberViewExercises,
  type PersonalWorkoutDto,
} from '@/api/generated'
import ExercisePicker from '@/features/workouts/ExercisePicker'
import UnitToggle from '@/features/workouts/UnitToggle'
import { lastUnit, shiftDateKey, toApi, todayKey, toForm, type FormExercise } from '@/features/workouts/data'
import { PERSONAL_KEY } from './MemberPersonalPage'

// 개인운동 작성·수정 (/member/personal/write?date=) — 하루 1건, 같은 날짜면 기존 기록을 불러와 수정
export default function MemberPersonalWritePage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const date = params.get('date') ?? todayKey()
  // 그날 기록 (없으면 null) — 이전 날짜 목록 API 로 하루치만
  const existing = useQuery({
    queryKey: [PERSONAL_KEY, 'day', date],
    queryFn: async () => (await memberViewPersonalWorkouts({ before: shiftDateKey(date, 1) })).find((w) => w.date === date) ?? null,
    staleTime: 0,
  })

  return (
    <div className="flex-1 md:overflow-y-auto">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-1 px-2">
          <Button variant="ghost" size="icon-lg" aria-label="뒤로" onClick={() => navigate('/member/personal')}>
            <ChevronLeft className="size-6" />
          </Button>
          <span className="text-lg font-semibold">개인운동 기록</span>
        </div>
      </header>
      <div className="mx-auto w-full max-w-xl px-5 pt-5 pb-12">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-muted-foreground">날짜</span>
          <input
            type="date"
            value={date}
            max={todayKey()}
            onChange={(e) => e.target.value && setParams({ date: e.target.value }, { replace: true })}
            className="h-10 rounded-lg border bg-transparent px-3 text-base"
          />
        </label>
        <p className="mt-1 text-right text-xs text-muted-foreground">지난 날짜도 선택해서 기록할 수 있어요</p>
        {existing.isPending && <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>}
        {existing.isError && <p className="py-16 text-center text-destructive">불러오지 못했어요</p>}
        {/* key: 날짜가 바뀌면 그날 기록으로 다시 채움 */}
        {existing.isSuccess && <Editor key={date} date={date} initial={existing.data} />}
      </div>
    </div>
  )
}

function Editor({ date, initial }: { date: string; initial: PersonalWorkoutDto | null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [exercises, setExercises] = useState<FormExercise[]>(() => (initial ? toForm({ title: '', memo: '', exercises: initial.exercises }).exercises : []))
  const [content, setContent] = useState(initial?.content ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const catalog = useMemberViewExercises({ query: { staleTime: Infinity } })
  const custom = useMemberViewCustomExercises({ query: { enabled: pickerOpen } })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const update = (fn: (list: FormExercise[]) => void) => {
    const next = structuredClone(exercises)
    fn(next)
    setExercises(next)
  }

  const done = async (run: () => Promise<unknown>, failMessage: string) => {
    setBusy(true)
    setError('')
    try {
      await run()
      await queryClient.invalidateQueries({ queryKey: [PERSONAL_KEY] })
      navigate('/member/personal')
    } catch {
      setError(failMessage)
      setBusy(false)
    }
  }
  const save = () =>
    done(
      () => memberViewSavePersonalWorkout(date, { content: content.trim(), exercises: toApi({ title: '', memo: '', exercises }).exercises }),
      '저장하지 못했어요. 다시 눌러 주세요',
    )
  const remove = () => done(() => memberViewRemovePersonalWorkout(date), '삭제하지 못했어요. 다시 눌러 주세요')

  return (
    <div className="mt-5 flex flex-col gap-4">
      {exercises.map((exercise, ei) => (
        <section key={ei} className="rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{exercise.name}</h2>
            <Button variant="ghost" size="icon-lg" aria-label={`${exercise.name} 삭제`} onClick={() => update((l) => void l.splice(ei, 1))}>
              <Trash2 className="text-muted-foreground" />
            </Button>
          </div>
          {exercise.sets.length > 0 && (
            <div className="mt-2 grid grid-cols-[2rem_1fr_1fr] items-center gap-2 text-center">
              <span className="text-xs text-muted-foreground">세트</span>
              <UnitToggle name={exercise.name} unit={exercise.unit} onChange={(unit) => update((l) => void (l[ei].unit = unit))} />
              <span className="text-xs text-muted-foreground">회</span>
              {exercise.sets.map((set, si) => (
                <SetInputs
                  key={si}
                  index={si}
                  kg={set.kg}
                  reps={set.reps}
                  onChange={(p) => update((l) => void Object.assign(l[ei].sets[si], p))}
                />
              ))}
            </div>
          )}
          <div className={`mt-3 grid gap-2 ${exercise.sets.length ? 'grid-cols-2' : ''}`}>
            {exercise.sets.length > 0 && (
              <Button variant="secondary" className="h-10" onClick={() => update((l) => void l[ei].sets.pop())}>
                <Minus /> 세트 삭제
              </Button>
            )}
            <Button
              variant="secondary"
              className="h-10"
              onClick={() =>
                update((l) => {
                  const s = l[ei].sets
                  s.push({ ...(s.at(-1) ?? { kg: '', reps: '' }), done: true })
                })
              }
            >
              <Plus /> {exercise.sets.length ? '세트 추가' : '무게·횟수 기록 (선택)'}
            </Button>
          </div>
        </section>
      ))}

      <Button variant="outline" className="h-12 rounded-xl border-dashed text-base" onClick={() => setPickerOpen(true)}>
        <Plus /> 운동 추가
      </Button>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={'오늘 운동은 어땠나요?\n컨디션, 느낀 점, 트레이너에게 묻고 싶은 것 등'}
        maxLength={2000}
        rows={5}
        className="w-full resize-none rounded-xl border bg-transparent p-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <Button className="h-12 rounded-xl text-base" disabled={busy || (!content.trim() && exercises.length === 0)} onClick={() => void save()}>
        {busy ? '저장하는 중…' : initial ? '수정 완료' : '기록하기'}
      </Button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
      {initial && (
        // 댓글까지 지워지므로 두 번 눌러야 삭제
        <Button
          variant="ghost"
          className="h-11 text-destructive"
          disabled={busy}
          onClick={() => (confirmDelete ? void remove() : setConfirmDelete(true))}
        >
          {confirmDelete ? '한 번 더 누르면 댓글까지 삭제돼요' : '기록 삭제'}
        </Button>
      )}

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        catalog={catalog.data}
        custom={custom.data}
        onPick={(name) => {
          update((l) => void l.push({ name, unit: lastUnit(name), sets: [] }))
          setPickerOpen(false)
        }}
      />
    </div>
  )
}

function SetInputs({
  index,
  kg,
  reps,
  onChange,
}: {
  index: number
  kg: string
  reps: string
  onChange: (p: { kg?: string; reps?: string }) => void
}) {
  return (
    <>
      <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
      <Input
        inputMode="decimal"
        value={kg}
        onChange={(e) => onChange({ kg: e.target.value })}
        placeholder="0"
        aria-label={`${index + 1}세트 무게`}
        className="h-11 text-center text-base md:text-base"
      />
      <Input
        inputMode="numeric"
        value={reps}
        onChange={(e) => onChange({ reps: e.target.value })}
        placeholder="0"
        aria-label={`${index + 1}세트 횟수`}
        className="h-11 text-center text-base md:text-base"
      />
    </>
  )
}
