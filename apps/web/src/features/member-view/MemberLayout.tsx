import { Navigate } from 'react-router'
import AppShell from '@/components/AppShell'
import { appTabs } from '@/components/tabs'
import { useMemberLogout, useMemberProfile } from './useMemberProfile'

const TABS = appTabs('/member')

// 회원 화면 레이아웃 — 트레이너 화면과 같은 메뉴 구조. 회원 토큰 없으면 코드 입력으로
export default function MemberLayout() {
  const profile = useMemberProfile()
  const logout = useMemberLogout()

  if (profile.isPending) return null
  if (profile.isError) return <Navigate to="/member" replace />
  return <AppShell tabs={TABS} userName={profile.data.name} logoutLabel="나가기" onLogout={logout} />
}
