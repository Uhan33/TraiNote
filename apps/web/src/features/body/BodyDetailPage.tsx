import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import WeightOverview from '@/components/WeightOverview'
import { getBodyListQueryKey, useBodyList, useBodyRemove, useBodySave, useMembersList } from '@/api/generated'
import { formatDateLabel, todayKey } from '@/features/workouts/data'

// 회원 체중 — 요약·그래프 + 입력(같은 날짜면 수정) + 기록 목록(누르면 수정·삭제)
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
  const existing = records.data?.find((r) => r.date === date)
  const weightKg = Number.parseFloat(weight.replace(',', '.'))
  const valid = Number.isFinite(weightKg) && weightKg >= 10 && weightKg <= 400

  const refresh = () => queryClient.invalidateQueries({ queryKey: getBodyListQueryKey(code) })
  const reset = () => {
    setDate(todayKey())
    setWeight('')
  }

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
          <WeightOverview records={records.data ?? []} />
        )}

        <form
          className="flex flex-col gap-3 rounded-2xl border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid) return
            save.mutate({ code, date, data: { weightKg: Math.round(weightKg * 100) / 100 } }, { onSuccess: () => void refresh().then(reset) })
          }}
        >
          <p className="font-semibold">{existing ? '체중 수정' : '체중 기록'}</p>
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <Input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value || todayKey())} aria-label="날짜" className="h-11 text-base md:text-base" />
            <div className="relative">
              <Input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={existing ? String(existing.weightKg) : '0.0'}
                aria-label="체중(kg)"
                className="h-11 pr-9 text-right text-base md:text-base"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
            </div>
          </div>
          {existing && <p className="text-xs text-muted-foreground">{formatDateLabel(date)}에 이미 {existing.weightKg}kg 기록이 있어요. 저장하면 바뀌어요.</p>}
          {weight && !valid && <p className="text-xs text-destructive">10~400kg 사이로 입력하세요</p>}
          {save.error && <p className="text-xs text-destructive">{save.error.message}</p>}
          <div className="flex gap-2">
            {existing && (
              <Button
                type="button"
                variant="destructive"
                className="h-11 flex-1 rounded-xl"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ code, date }, { onSuccess: () => void refresh().then(reset) })}
              >
                삭제
              </Button>
            )}
            <Button type="submit" className="h-11 flex-[2] rounded-xl text-base" disabled={!valid || save.isPending}>
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
                      onClick={() => {
                        setDate(r.date)
                        setWeight(String(r.weightKg))
                      }}
                      className={`flex h-12 w-full items-center justify-between px-4 text-left active:bg-muted ${r.date === date ? 'bg-muted' : ''}`}
                    >
                      <span className="text-sm">{formatDateLabel(r.date)}</span>
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
