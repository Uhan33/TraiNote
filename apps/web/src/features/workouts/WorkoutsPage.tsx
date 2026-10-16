import { Outlet, useParams } from 'react-router'
import WorkoutListPage from './WorkoutListPage'

// 모바일: 목록 ↔ 상세 화면 전환 / 태블릿·PC(md 이상): 좌측 회원 목록 + 우측 일지 동시 표시
export default function WorkoutsPage() {
  const { memberId } = useParams()

  return (
    <div className="flex flex-1 md:min-h-0">
      <section className={`${memberId ? 'hidden' : 'flex'} w-full flex-col md:flex md:w-80 md:shrink-0 md:overflow-y-auto md:border-r lg:w-96`}>
        <WorkoutListPage />
      </section>
      <section className={`${memberId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex md:overflow-y-auto`}>
        <Outlet />
      </section>
    </div>
  )
}

export function NoMemberSelected() {
  return <p className="flex flex-1 items-center justify-center text-muted-foreground">회원을 선택하세요</p>
}
