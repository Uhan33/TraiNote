import { ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router'
import { Input } from '@/components/ui/input'
import { useMembersList } from '@/api/generated'

// 성장 (/body) — 모바일: 회원 목록 ↔ 상세 전환 / 태블릿·PC: 좌측 회원 목록 + 우측 체중
export default function BodyPage() {
  const { memberId } = useParams()
  return (
    <div className="flex flex-1 md:min-h-0">
      <section className={`${memberId ? 'hidden' : 'flex'} w-full flex-col md:flex md:w-80 md:shrink-0 md:overflow-y-auto md:border-r lg:w-96`}>
        <BodyMemberList />
      </section>
      <section className={`${memberId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex md:overflow-y-auto`}>
        <Outlet />
      </section>
    </div>
  )
}

function BodyMemberList() {
  const [query, setQuery] = useState('')
  const members = useMembersList()
  const rows = (members.data ?? []).filter((m) => m.name.includes(query.trim()) || m.memo.includes(query.trim()))

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-6">
        <h1 className="text-2xl font-bold">성장</h1>
      </header>
      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="회원 검색" className="h-11 pl-9 text-base md:text-base" />
        </div>
      </div>
      <ul className="flex flex-col px-3 pt-3 pb-6">
        {rows.map((m) => (
          <li key={m.code}>
            <NavLink
              to={`/body/${m.code}`}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-2 py-3 active:bg-muted md:hover:bg-muted/60 ${isActive ? 'md:bg-muted' : ''}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">{m.name[0]}</span>
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="shrink-0 font-semibold">{m.name}</span>
                {m.memo && <span className="truncate text-sm text-muted-foreground">{m.memo}</span>}
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </NavLink>
          </li>
        ))}
        {members.isPending && <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>}
        {members.isSuccess && members.data.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">회원은 운동일지 탭에서 추가할 수 있어요</p>
        )}
        {members.isSuccess && members.data.length > 0 && rows.length === 0 && <p className="py-16 text-center text-muted-foreground">검색 결과가 없어요</p>}
      </ul>
    </div>
  )
}
