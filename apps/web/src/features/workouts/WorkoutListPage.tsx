import { ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useSearchParams } from 'react-router'
import { Input } from '@/components/ui/input'
import AddMemberButton from './AddMemberButton'
import DateNav from './DateNav'
import { findWorkout, members, summarize, todayKey, workouts } from './data'

export default function WorkoutListPage() {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? todayKey()
  const [query, setQuery] = useState('')

  const rows = members
    .filter((m) => m.name.includes(query.trim()))
    .map((m) => ({ member: m, workout: findWorkout(m.id, date) }))
  const doneCount = rows.filter((r) => r.workout).length

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-2xl font-bold">운동일지</h1>
        <AddMemberButton date={date} />
      </header>

      <div className="px-3 pt-3">
        <DateNav
          value={date}
          onChange={(d) => setParams({ date: d }, { replace: true })}
          markedDates={[...new Set(workouts.map((w) => w.date))]}
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
          const summary = workout && summarize(workout)
          return (
            <li key={member.id}>
              <NavLink
                to={`/workouts/${member.id}?date=${date}`}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-2 py-3 active:bg-muted lg:hover:bg-muted/60 ${isActive ? 'lg:bg-muted' : ''}`}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">{member.name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{member.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {workout && summary
                      ? `${workout.title || '운동'} · ${summary.exerciseCount}개 운동 · ${summary.setCount}세트`
                      : '작성 전'}
                  </span>
                </span>
                {workout && <span className="size-2 shrink-0 rounded-full bg-foreground" aria-label="작성 완료" />}
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </NavLink>
            </li>
          )
        })}
        {rows.length === 0 && <p className="py-16 text-center text-muted-foreground">검색 결과가 없어요</p>}
      </ul>
    </div>
  )
}
