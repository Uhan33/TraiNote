import { Navigate } from 'react-router'
import { isUnauthorized } from '@/api/fetcher'
import ConnectionError from '@/components/ConnectionError'
import AppShell from '@/components/AppShell'
import { appTabs } from '@/components/tabs'
import PushConsent from './PushConsent'
import { usePushConsent } from './usePushConsent'
import { useMemberLogout, useMemberProfile } from './useMemberProfile'
import Splash from '@/components/Splash'

const TABS = appTabs('/member')

// 회원 화면 레이아웃 — 트레이너 화면과 같은 메뉴 구조. 회원 토큰 없으면(401) 코드 입력으로, 서버 연결 실패면 다시 시도
// 홈 화면 앱으로 처음 열면 알림 동의 화면 먼저 (한 번만)
export default function MemberLayout() {
  const profile = useMemberProfile()
  const logout = useMemberLogout()
  const push = usePushConsent()

  if (profile.isPending) return <Splash />
  if (profile.isError && !isUnauthorized(profile.error)) {
    return <ConnectionError onRetry={() => void profile.refetch()} retrying={profile.isFetching} />
  }
  if (profile.isError) return <Navigate to="/member" replace />
  if (push.show) return <PushConsent onDone={push.finish} />
  return <AppShell tabs={TABS} userName={profile.data.name} logoutLabel="나가기" onLogout={logout} />
}
