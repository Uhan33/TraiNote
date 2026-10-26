import { useQueryClient } from '@tanstack/react-query'
import { Check, CircleCheck, ChevronLeft, History, Minus, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/api/fetcher'
import {
  getWorkoutsGetQueryKey,
  getWorkoutsListByDateQueryKey,
  getMembersListQueryKey,
  getWorkoutsListDraftsQueryKey,
  useExercisesList,
  useMembersList,
  useWorkoutsGet,
  useWorkoutsMemberLoggedDates,
  useWorkoutsPrevious,
  workoutsComplete,
  workoutsSave,
  type WorkoutLogDto,
  type MemberDto,
} from '@/api/generated'
import CopyId from './CopyId'
import DateNav from './DateNav'
import MemberMenu from './MemberMenu'
import { EMPTY_FORM, formatDateLabel, groupExercises, toApi, todayKey, toForm, type FormSet, type WorkoutForm } from './data'
import { backupKey, readBackup } from './backup'
import { useAutosave, type SaveStatus } from './useAutosave'

export default function WorkoutEditPage() {
  const { memberId: code = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const date = params.get('date') ?? todayKey()
  const members = useMembersList()
  const member = members.data?.find((m) => m.code === code.toUpperCase())
  const dates = useWorkoutsMemberLoggedDates(code, { query: { enabled: !!member } })
  const queryClient = useQueryClient()
  // 편집기의 저장 상태 — 저장 실패 중에 나가려 하면 알려 줌
  const saveStatus = useRef<SaveStatus>('saved')
  // 저장 실패 중이거나 작성 완료 전 일지를 두고 나가려 하면 한 번 확인 (뒤로가기 버튼·제스처, 날짜·탭 이동 모두)
  const [leaveReason, setLeaveReason] = useState<'unsaved' | 'draft'>('draft')
  const blocker = useBlocker(({ currentLocation: from, nextLocation: to }) => {
    if (from.pathname === to.pathname && from.search === to.search) return false
    if (saveStatus.current === 'error') {
      setLeaveReason('unsaved')
      return true
    }
    const log = member && queryClient.getQueryData<WorkoutLogDto>(getWorkoutsGetQueryKey(member.code, date))
    setLeaveReason('draft')
    return !!log && !log.completedAt
  })

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 max-w-2xl items-center gap-1 px-2 lg:px-6">
          <Button variant="ghost" size="icon-lg" aria-label="회원 목록" className="md:hidden" onClick={() => navigate(`/workouts?date=${date}`)}>
            <ChevronLeft className="size-6" />
          </Button>
          <span className="text-lg font-semibold">{member?.name ?? (members.isPending ? '' : '회원 없음')}</span>
          {member && <CopyId id={member.code} />}
          {member && <MemberMenu member={member} date={date} />}
        </div>
        {member && (
          <div className="max-w-2xl px-3 pb-2 lg:px-5">
            <DateNav value={date} onChange={(d) => setParams({ date: d }, { replace: true })} markedDates={dates.data ?? []} />
          </div>
        )}
      </header>

      <Drawer open={blocker.state === 'blocked'} onOpenChange={(o) => !o && blocker.reset?.()}>
        <DrawerContent className="mx-auto max-w-md">
          {leaveReason === 'unsaved' ? (
            <DrawerHeader>
              <DrawerTitle>아직 저장하지 못했어요</DrawerTitle>
              <p className="text-sm text-muted-foreground">
                인터넷 연결이 불안정해요.
                <br />
                작성한 내용은 이 기기에 보관해 두었다가 연결되면 자동으로 저장해요.
              </p>
            </DrawerHeader>
          ) : (
            <DrawerHeader>
              <DrawerTitle>아직 작성 완료 전이에요</DrawerTitle>
              <p className="text-sm text-muted-foreground">
                작성한 내용은 저장돼 있어요.
                <br />
                <span className="font-semibold text-foreground">작성 완료</span>를 눌러야 회원에게 일지가 보여요.
              </p>
            </DrawerHeader>
          )}
          <div className="flex flex-col gap-2 px-4 pb-6">
            <Button className="h-12 rounded-xl text-base" onClick={() => blocker.reset?.()}>
              계속 작성하기
            </Button>
            <Button variant="ghost" className="h-12 rounded-xl text-base text-muted-foreground" onClick={() => blocker.proceed?.()}>
              {leaveReason === 'unsaved' ? '나갈게요' : '나중에 완료할게요'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {members.isSuccess && !member && <p className="py-16 text-center text-muted-foreground">회원을 찾을 수 없어요</p>}
      {/* key: 회원·날짜가 바뀌면 편집 상태를 새로 로드 */}
      {member && (
        <WorkoutLoader
          key={`${member.code}-${date}`}
          member={member}
          date={date}
          onStatus={(s) => {
            saveStatus.current = s
          }}
        />
      )}
    </div>
  )
}

type EditorProps = { member: MemberDto; date: string; onStatus: (status: SaveStatus) => void }

// 서버 일지를 불러온 뒤 편집기 표시. 404 = 그날 일지 없음 → 빈 편집기
// 열 때마다 서버에서 새로 받음 — 다른 기기에서 고친 내용을 옛 화면으로 덮어쓰지 않게
// 이 기기에 저장 못 한 보관본이 있으면 그걸로 이어서 작성 (연결이 끊겨 못 불러와도)
// 편집기를 한 번 띄운 뒤에는 다시 불러오기가 실패해도 그대로 유지 — 작성 중인 내용이 사라지지 않게
function WorkoutLoader(props: EditorProps) {
  const { member, date } = props
  const log = useWorkoutsGet(member.code, date, { query: { retry: false, refetchOnWindowFocus: false } })
  const error: unknown = log.error
  const notFound = error instanceof ApiError && error.status === 404
  const [backup] = useState(() => readBackup(backupKey(member.code, date)))
  const [start, setStart] = useState<{ initial: WorkoutForm; completedAt: string | null } | null>(null)

  if (!start) {
    if (!log.isFetchedAfterMount && !log.isError) return <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>
    if (log.isError && !notFound && !backup) return <p className="py-16 text-center text-destructive">일지를 불러오지 못했어요</p>
    const server = notFound ? undefined : log.data
    setStart({ initial: backup ?? (server ? toForm(server) : EMPTY_FORM), completedAt: server?.completedAt ?? null })
    return null
  }
  return <WorkoutEditor {...props} initial={start.initial} restored={!!backup} initialCompletedAt={start.completedAt} />
}

function WorkoutEditor({
  member,
  date,
  onStatus,
  initial,
  restored,
  initialCompletedAt,
}: EditorProps & {
  initial: WorkoutForm
  restored: boolean
  initialCompletedAt: string | null
}) {
  const queryClient = useQueryClient()
  const [workout, setWorkout] = useState<WorkoutForm>(initial)
  // 작성 완료 시각 — 완료해야 회원에게 보이고 알림이 감
  const [completedAt, setCompletedAt] = useState(initialCompletedAt)
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const previous = useWorkoutsPrevious(member.code, { before: date }, { query: { retry: false, enabled: workout.exercises.length === 0 } })
  // 서버에 이 날 일지가 있는지 — 생기거나 없어질 때만 목록·달력·남은 PT 를 다시 불러옴
  const exists = useRef(initial.exercises.length > 0)

  const autosave = useAutosave(async (value: WorkoutForm) => {
    const body = toApi(value)
    await workoutsSave(member.code, date, body)
    const saved: WorkoutLogDto | null = body.exercises.length ? { ...body, memberCode: member.code, date, completedAt } : null
    if (!saved) setCompletedAt(null) // 운동을 다 지우면 일지 삭제 — 다시 쓰면 새 일지(작성 중)
    // 이 일지·그날 목록 캐시를 저장한 값으로 직접 교체 (요청 없음) — 다시 열었을 때 옛 내용으로 덮어쓰지 않게
    const key = getWorkoutsGetQueryKey(member.code, date)
    if (saved) queryClient.setQueryData(key, saved)
    else queryClient.removeQueries({ queryKey: key })
    queryClient.setQueryData<WorkoutLogDto[]>(getWorkoutsListByDateQueryKey({ date }), (list) =>
      list && [...list.filter((l) => l.memberCode !== member.code), ...(saved ? [saved] : [])],
    )
    if (exists.current === !!saved) return
    exists.current = !!saved
    // 일지가 새로 생기거나 삭제됨 — 달력 점·지난 기록·남은 PT 횟수 갱신
    await queryClient.invalidateQueries({
      predicate: (q) =>
        typeof q.queryKey[0] === 'string' &&
        ((q.queryKey[0].includes('/workouts/') && q.queryKey[0] !== key[0]) || q.queryKey[0] === '/api/v1/members'),
    })
  }, backupKey(member.code, date))

  useEffect(() => {
    onStatus(autosave.status)
  }, [onStatus, autosave.status])
  // 이 기기에 남은 보관본으로 열었으면 바로 서버에 저장
  const { queue } = autosave
  useEffect(() => {
    if (restored) queue(initial)
  }, [restored, initial, queue])

  // 남은 변경을 먼저 저장한 뒤 완료 처리 — 회원은 마지막 내용까지 받음
  const complete = async () => {
    setCompleting(true)
    setCompleteError(false)
    try {
      if (!(await autosave.flush())) throw new Error('save failed')
      await workoutsComplete(member.code, date)
      const now = new Date().toISOString()
      setCompletedAt(now)
      queryClient.setQueryData<WorkoutLogDto>(getWorkoutsGetQueryKey(member.code, date), (log) => log && { ...log, completedAt: now })
      queryClient.setQueryData<WorkoutLogDto[]>(getWorkoutsListByDateQueryKey({ date }), (list) =>
        list?.map((l) => (l.memberCode === member.code ? { ...l, completedAt: now } : l)),
      )
      queryClient.setQueryData<WorkoutLogDto[]>(getWorkoutsListDraftsQueryKey(), (list) =>
        list?.filter((l) => l.memberCode !== member.code || l.date !== date),
      )
      // 작성 완료한 일지부터 PT 1회 차감 — 남은 횟수 갱신
      void queryClient.invalidateQueries({ queryKey: getMembersListQueryKey() })
    } catch {
      setCompleteError(true)
    } finally {
      setCompleting(false)
    }
  }

  const update = (fn: (w: WorkoutForm) => void) => {
    const next = structuredClone(workout)
    fn(next)
    setWorkout(next)
    autosave.queue(next)
  }

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col gap-6 px-5 pt-5 pb-10 lg:px-8">
        <div className="flex items-center gap-3">
          <input
            value={workout.title}
            onChange={(e) => update((w) => void (w.title = e.target.value))}
            placeholder="오늘의 운동 (예: 하체)"
            maxLength={50}
            className="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground/50"
          />
          <SaveIndicator status={autosave.status} onRetry={autosave.retry} />
        </div>

        {previous.data && workout.exercises.length === 0 && (
          <button
            type="button"
            onClick={() =>
              update((w) => {
                const prev = toForm(previous.data)
                w.title ||= prev.title
                w.exercises = prev.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: false })) }))
              })
            }
            className="flex items-center gap-3 rounded-2xl border border-dashed p-4 text-left active:bg-muted"
          >
            <History className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">지난 기록 불러오기</span>
              <span className="block truncate text-sm text-muted-foreground">
                {formatDateLabel(previous.data.date)} · {previous.data.title || '운동'} · {previous.data.exercises.map((e) => e.name).join(', ')}
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
                const patch = (p: Partial<FormSet>) => update((w) => void Object.assign(w.exercises[ei].sets[si], p))
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
          maxLength={2000}
          rows={3}
          className="w-full resize-none rounded-xl border bg-transparent p-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        {workout.exercises.length > 0 &&
          (completedAt ? (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm text-muted-foreground">
              <CircleCheck className="size-4" /> 작성 완료 · 수정하면 회원 화면에도 바로 반영돼요
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <Button className="h-12 rounded-xl text-base" disabled={completing} onClick={() => void complete()}>
                {completing ? '완료하는 중…' : '작성 완료'}
              </Button>
              <p className={`text-center text-xs ${completeError ? 'text-destructive' : 'text-muted-foreground'}`}>
                {completeError ? '완료하지 못했어요. 다시 눌러 주세요' : '완료해야 회원에게 일지가 보여요'}
              </p>
            </div>
          ))}
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


function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === 'error') {
    return (
      <button type="button" onClick={onRetry} className="shrink-0 text-sm font-medium text-destructive">
        저장 실패 · 다시 시도
      </button>
    )
  }
  return (
    <span className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
      {status === 'saved' ? '저장됨' : '저장 중…'}
    </span>
  )
}

function SetRow({ index, set, onChange }: { index: number; set: FormSet; onChange: (p: Partial<FormSet>) => void }) {
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
  // 종목은 운영자가 가끔 DB 에 추가하는 정도라 한 번 받으면 앱을 다시 열 때까지 재요청 안 함
  const catalog = useExercisesList({ query: { staleTime: Infinity } })
  const groups = groupExercises(catalog.data ?? [])
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
