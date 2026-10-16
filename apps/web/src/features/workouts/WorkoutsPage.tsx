import { Outlet, useParams } from 'react-router'
import WorkoutListPage from './WorkoutListPage'

// 모바일: 목록 ↔ 상세 화면 전환 / PC: 좌측 회원 목록 + 우측 일지 동시 표시
export default function WorkoutsPage() {
  const { memberId } = useParams()

  return (
    <div className="flex flex-1 lg:min-h-0">
      <section className={`${memberId ? 'hidden' : 'flex'} w-full flex-col lg:flex lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:border-r`}>
        <WorkoutListPage />
      </section>
      <section className={`${memberId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col lg:flex lg:overflow-y-auto`}>
        <Outlet />
      </section>
    </div>
  )
}

export function NoMemberSelected() {
  return <p className="flex flex-1 items-center justify-center text-muted-foreground">회원을 선택하세요</p>
}
