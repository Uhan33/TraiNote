import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import BodyOverview from '@/components/BodyOverview'
import { getBodyListQueryKey, useBodyList, useBodyRemove, useBodySave, useMembersList, type BodyRecordDto } from '@/api/generated'
import { formatDateLabel, todayKey } from '@/features/workouts/data'

// 회원 체중·체성분 — 요약·그래프 + 입력(같은 날짜면 수정) + 기록 목록(누르면 수정·삭제)
export default function BodyDetailPage() {
  const { memberId: code = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const members = useMembersList()
  const member = members.data?.find((m) => m.code === code.toUpperCase())
  const records = useBodyList(code, { query: { enabled: !!member } })
  const save = useBodySave<Error>()
  const remove = useBodyRemove<Error>()

  const [date, setDate] = useState(todayKey())
  const [weight, setWeight] = useState('')
  const [fat, setFat] = useState('')
  const [muscle, setMuscle] = useState('')
  const existing = records.data?.find((r) => r.date === date)
  const weightKg = parse(weight)
  const fatPct = parse(fat)
  const muscleKg = parse(muscle)
  const weightOk = weightKg !== null && weightKg >= 10 && weightKg <= 400
  const fatOk = !fat.trim() || (fatPct !== null && fatPct >= 1 && fatPct <= 75)
  const muscleOk = !muscle.trim() || (muscleKg !== null && muscleKg >= 5 && muscleKg <= 100)
  const valid = weightOk && fatOk && muscleOk
  // 저장할 값 (서버와 같은 자릿수로 반올림)
  const values = {
    weightKg: weightKg === null ? null : round(weightKg, 2),
    bodyFatPct: fatPct === null ? null : round(fatPct, 1),
    skeletalMuscleKg: muscleKg === null ? null : round(muscleKg, 2),
  }
  // 이미 기록이 있는 날짜는 값이 바뀌었을 때만 저장 가능
  const changed =
    !existing ||
    values.weightKg !== existing.weightKg ||
    values.bodyFatPct !== existing.bodyFatPct ||
    values.skeletalMuscleKg !== existing.skeletalMuscleKg

  const refresh = () => queryClient.invalidateQueries({ queryKey: getBodyListQueryKey(code) })
  const fill = (r?: BodyRecordDto) => {
    setWeight(r ? String(r.weightKg) : '')
    setFat(r?.bodyFatPct?.toString() ?? '')
    setMuscle(r?.skeletalMuscleKg?.toString() ?? '')
  }
  // 날짜가 바뀌거나 기록을 처음 불러오면 입력칸을 그 날짜 기록으로 채움(없으면 비움)
  // — 이미 기록한 날짜에 체지방률만 추가하거나, 다른 날짜로 넘어갈 때 이전 입력이 남지 않게
  const [filledFor, setFilledFor] = useState<string | null>(null)
  if (records.data && filledFor !== date) {
    setFilledFor(date)
    fill(existing)
  }
  // 저장·삭제 후 날짜는 그대로 두고, 서버에 반영된 값으로 다시 채움 (삭제했으면 빈칸)
  const refill = () => setFilledFor(null)

  if (members.isSuccess && !member) return <p className="py-16 text-center text-muted-foreground">회원을 찾을 수 없어요</p>

  const list = [...(records.data ?? [])].reverse() // 최신순

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 max-w-2xl items-center gap-1 px-2 lg:px-6">
          <Button variant="ghost" size="icon-lg" aria-label="회원 목록" className="md:hidden" onClick={() => navigate('/body')}>
            <ChevronLeft className="size-6" />
          </Button>
          <span className="text-lg font-semibold">{member?.name}</span>
          <span className="text-sm text-muted-foreground">체중</span>
        </div>
      </header>

      <div className="flex w-full max-w-2xl flex-col gap-6 px-5 pt-5 pb-10 lg:px-8">
        {records.isPending ? (
          <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>
        ) : (
          <BodyOverview records={records.data ?? []} />
        )}

        <form
          className="flex flex-col gap-3 rounded-2xl border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid || !changed) return
            save.mutate(
              { code, date, data: { ...values, weightKg: values.weightKg! } },
              { onSuccess: () => void refresh().then(refill) },
            )
          }}
        >
          <p className="font-semibold">{existing ? '기록 수정' : '기록 추가'}</p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(e) => setDate(e.target.value || todayKey())}
              aria-label="날짜"
              // iOS Safari 날짜 입력은 기본 모양이 높이·최소 너비를 무시해 옆 칸과 겹침 → 기본 모양 제거
              className="h-11 min-w-0 appearance-none text-base md:text-base [&::-webkit-date-and-time-value]:text-left"
            />
            <UnitInput label="체중" unit="kg" value={weight} onChange={setWeight} placeholder="0.0" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <UnitInput label="체지방률 (선택)" unit="%" value={fat} onChange={setFat} placeholder="체지방률" />
            <UnitInput label="골격근량 (선택)" unit="kg" value={muscle} onChange={setMuscle} placeholder="골격근량" />
          </div>
          {existing && <p className="text-xs text-muted-foreground">{formatDateLabel(date)}에 이미 기록이 있어요. 저장하면 바뀌어요.</p>}
          {weight && !weightOk && <p className="text-xs text-destructive">체중은 10~400kg 사이로 입력하세요</p>}
          {!fatOk && <p className="text-xs text-destructive">체지방률은 1~75% 사이로 입력하세요</p>}
          {!muscleOk && <p className="text-xs text-destructive">골격근량은 5~100kg 사이로 입력하세요</p>}
          {save.error && <p className="text-xs text-destructive">{save.error.message}</p>}
          <div className="flex gap-2">
            {existing && (
              <Button
                type="button"
                variant="destructive"
                className="h-11 flex-1 rounded-xl"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ code, date }, { onSuccess: () => void refresh().then(refill) })}
              >
                삭제
              </Button>
            )}
            <Button type="submit" className="h-11 flex-[2] rounded-xl text-base" disabled={!valid || !changed || save.isPending}>
              저장
            </Button>
          </div>
        </form>

        {list.length > 0 && (
          <section>
            <h2 className="px-1 pb-2 text-sm font-semibold text-muted-foreground">기록 · 누르면 수정</h2>
            <ul className="divide-y rounded-2xl border">
              {list.map((r, i) => {
                const prev = list[i + 1]
                const diff = prev ? Math.round((r.weightKg - prev.weightKg) * 100) / 100 : null
                return (
                  <li key={r.date}>
                    <button
                      type="button"
                      onClick={() => setDate(r.date)}
                      className={`flex min-h-12 w-full items-center justify-between px-4 py-2 text-left active:bg-muted ${r.date === date ? 'bg-muted' : ''}`}
                    >
                      <span className="flex flex-col">
                        <span className="text-sm">{formatDateLabel(r.date)}</span>
                        <CompositionText record={r} />
                      </span>
                      <span className="flex items-baseline gap-2">
                        {diff !== null && diff !== 0 && (
                          <span className="text-xs text-muted-foreground">
                            {diff > 0 ? '▲' : '▼'} {Math.abs(diff)}
                          </span>
                        )}
                        <span className="font-semibold">{r.weightKg}kg</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

const parse = (v: string) => {
  const n = Number.parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits

function UnitInput({ label, unit, value, onChange, placeholder }: { label: string; unit: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-11 pr-9 text-right text-base md:text-base"
      />
      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
    </div>
  )
}

// 체지방률·골격근량 한 줄 (있을 때만)
export function CompositionText({ record }: { record: BodyRecordDto }) {
  const parts = [record.bodyFatPct !== null && `체지방 ${record.bodyFatPct}%`, record.skeletalMuscleKg !== null && `골격근 ${record.skeletalMuscleKg}kg`].filter(Boolean)
  return parts.length ? <span className="text-xs text-muted-foreground">{parts.join(' · ')}</span> : null
}
