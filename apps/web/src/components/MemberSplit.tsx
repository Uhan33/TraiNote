import { ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router'
import { Input } from '@/components/ui/input'
import { useMembersList, usePersonalWorkoutsUnread } from '@/api/generated'

// 회원별 화면 공통 틀 (성장 /body, 개인운동 /personal) — 모바일: 회원 목록 ↔ 상세 전환 / 태블릿·PC: 좌측 회원 목록 + 우측 상세
// showUnread: 회원 이름 옆에 안 읽은 개인운동 수
export default function MemberSplit({ title, base, showUnread = false }: { title: string; base: string; showUnread?: boolean }) {
  const { memberId } = useParams()
  return (
    <div className="flex flex-1 md:min-h-0">
      <section className={`${memberId ? 'hidden' : 'flex'} w-full flex-col md:flex md:w-80 md:shrink-0 md:overflow-y-auto md:border-r lg:w-96`}>
        <MemberList title={title} base={base} showUnread={showUnread} />
      </section>
      <section className={`${memberId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex md:overflow-y-auto`}>
        <Outlet />
      </section>
    </div>
  )
}

function MemberList({ title, base, showUnread }: { title: string; base: string; showUnread: boolean }) {
  const [query, setQuery] = useState('')
  const members = useMembersList()
  // AppLayout 과 같은 쿼리 — 요청은 한 번
  const unread = usePersonalWorkoutsUnread({ query: { enabled: showUnread } })
  const unreadOf = (code: string) => unread.data?.find((u) => u.memberCode === code)?.count ?? 0
  const rows = (members.data ?? []).filter((m) => m.name.includes(query.trim()) || m.memo.includes(query.trim()))

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-6">
        <h1 className="text-2xl font-bold">{title}</h1>
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
              to={`${base}/${m.code}`}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-2 py-3 active:bg-muted md:hover:bg-muted/60 ${isActive ? 'md:bg-muted' : ''}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">{m.name[0]}</span>
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="shrink-0 font-semibold">{m.name}</span>
                {m.memo && <span className="truncate text-sm text-muted-foreground">{m.memo}</span>}
              </span>
              {unreadOf(m.code) > 0 && (
                <span aria-label={`새 기록 ${unreadOf(m.code)}개`} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                  {unreadOf(m.code)}
                </span>
              )}
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
