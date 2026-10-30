import { useMatch } from 'react-router'
import { useAuthMe, usePersonalWorkoutsUnread } from '@/api/generated'
import { useLogout } from '@/features/auth/useLogout'
import { useUnsavedSync } from '@/features/workouts/backup'
import Announcement from './Announcement'
import AppShell from './AppShell'
import { appTabs } from './tabs'

const TABS = appTabs('')
// 회원 새 개인운동 확인 주기 — 앱으로 돌아올 때도 다시 확인
const UNREAD_POLL_MS = 60_000

// 트레이너 화면 레이아웃
export default function AppLayout() {
  const workoutDetail = useMatch('/workouts/:memberId')
  const bodyDetail = useMatch('/body/:memberId')
  const personalDetail = useMatch('/personal/:memberId')
  const inDetail = !!(workoutDetail || bodyDetail || personalDetail)
  const me = useAuthMe({ query: { staleTime: Infinity } })
  useUnsavedSync() // 연결이 끊겨 이 기기에만 남은 일지를 서버에 저장
  const logout = useLogout()
  const unread = usePersonalWorkoutsUnread({ query: { refetchInterval: UNREAD_POLL_MS } })
  const tabs = TABS.map((t) => (t.to === '/personal' ? { ...t, badge: !!unread.data?.length } : t))
  return (
    <>
      <AppShell tabs={tabs} userName={me.data?.name} logoutLabel="로그아웃" onLogout={logout} inDetail={inDetail} />
      <Announcement id="trainer-personal-workout" title="회원 개인운동 탭이 생겼어요" actionLabel="개인운동 보러 가기" actionTo="/personal">
        회원이 혼자 운동한 내용을 직접 기록할 수 있어요.
        <br />
        <span className="font-semibold text-foreground">새로 올라온 기록</span>은 따로 표시돼서 한눈에 확인하고, 댓글로 바로 피드백할 수 있어요.
      </Announcement>
    </>
  )
}

export { ComingSoon } from './AppShell'
