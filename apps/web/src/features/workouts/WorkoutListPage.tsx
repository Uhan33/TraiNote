import { ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useSearchParams } from 'react-router'
import { Input } from '@/components/ui/input'
import AddMemberButton from './AddMemberButton'
import DateNav from './DateNav'
import { useMembersList, useWorkoutsListByDate, useWorkoutsLoggedDates } from '@/api/generated'
import { PT_LOW, ptLabel, summarize, todayKey } from './data'

export default function WorkoutListPage() {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? todayKey()
  const [query, setQuery] = useState('')

  const members = useMembersList()
  const logs = useWorkoutsListByDate({ date })
  const dates = useWorkoutsLoggedDates()
  const logByCode = new Map(logs.data?.map((log) => [log.memberCode, log]))

  const rows = (members.data ?? [])
    .filter((m) => m.name.includes(query.trim()) || m.memo.includes(query.trim()))
    .map((m) => ({ member: m, workout: logByCode.get(m.code) }))
  const doneCount = rows.filter((r) => r.workout).length

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-2xl font-bold">운동일지</h1>
        <AddMemberButton />
      </header>

      <div className="px-3 pt-3">
        <DateNav
          value={date}
          onChange={(d) => setParams({ date: d }, { replace: true })}
          markedDates={dates.data ?? []}
        />
      </div>

      <div className="px-5 pt-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="회원 검색" className="h-11 pl-9 text-base md:text-base" />
        </div>
        <p className="pt-4 pb-1 text-sm text-muted-foreground">
          회원 {rows.length}명 · 작성 {doneCount}
        </p>
      </div>

      <ul className="flex flex-col px-3 pb-6">
        {rows.map(({ member, workout }) => {
          const summary = workout && summarize(workout.exercises)
          return (
            <li key={member.code}>
              <NavLink
                to={`/workouts/${member.code}?date=${date}`}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-2 py-3 active:bg-muted md:hover:bg-muted/60 ${isActive ? 'md:bg-muted' : ''}`}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">{member.name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="shrink-0 font-semibold">{member.name}</span>
                    {member.memo && <span className="truncate text-sm text-muted-foreground">{member.memo}</span>}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {workout && summary
                      ? `${workout.title || '운동'} · ${summary.exerciseCount}개 운동 · ${summary.setCount}세트`
                      : '작성 전'}
                  </span>
                </span>
                {member.ptRemaining !== null && (
                  <span className={`shrink-0 text-sm ${member.ptRemaining <= PT_LOW ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                    {ptLabel(member.ptRemaining)}
                  </span>
                )}
                {workout && <span className="size-2 shrink-0 rounded-full bg-foreground" aria-label="작성 완료" />}
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </NavLink>
            </li>
          )
        })}
        {members.isPending && <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>}
        {members.isError && <p className="py-16 text-center text-destructive">회원 목록을 불러오지 못했어요</p>}
        {members.isSuccess && members.data.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            아직 회원이 없어요
            <br />
            오른쪽 위 <span className="font-semibold text-foreground">회원 추가</span>로 시작해 보세요
          </p>
        )}
        {members.isSuccess && members.data.length > 0 && rows.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">검색 결과가 없어요</p>
        )}
      </ul>
    </div>
  )
}
