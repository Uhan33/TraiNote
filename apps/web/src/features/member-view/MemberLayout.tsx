import { Navigate } from 'react-router'
import { isUnauthorized } from '@/api/fetcher'
import ConnectionError from '@/components/ConnectionError'
import AppShell from '@/components/AppShell'
import { appTabs } from '@/components/tabs'
import { useMemberLogout, useMemberProfile } from './useMemberProfile'

const TABS = appTabs('/member')

// 회원 화면 레이아웃 — 트레이너 화면과 같은 메뉴 구조. 회원 토큰 없으면(401) 코드 입력으로, 서버 연결 실패면 다시 시도
export default function MemberLayout() {
  const profile = useMemberProfile()
  const logout = useMemberLogout()

  if (profile.isPending) return null
  if (profile.isError && !isUnauthorized(profile.error)) {
    return <ConnectionError onRetry={() => void profile.refetch()} retrying={profile.isFetching} />
  }
  if (profile.isError) return <Navigate to="/member" replace />
  return <AppShell tabs={TABS} userName={profile.data.name} logoutLabel="나가기" onLogout={logout} />
}
