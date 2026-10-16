import { useMatch } from 'react-router'
import { useAuthMe } from '@/api/generated'
import { useLogout } from '@/features/auth/useLogout'
import AppShell from './AppShell'
import { appTabs } from './tabs'

const TABS = appTabs('')

// 트레이너 화면 레이아웃
export default function AppLayout() {
  const workoutDetail = useMatch('/workouts/:memberId')
  const bodyDetail = useMatch('/body/:memberId')
  const inDetail = !!(workoutDetail || bodyDetail)
  const me = useAuthMe({ query: { staleTime: Infinity } })
  const logout = useLogout()
  return <AppShell tabs={TABS} userName={me.data?.name} logoutLabel="로그아웃" onLogout={logout} inDetail={inDetail} />
}

export { ComingSoon } from './AppShell'
