import { Navigate } from 'react-router'
import { isUnauthorized } from '@/api/fetcher'
import ConnectionError from '@/components/ConnectionError'
import Announcement from '@/components/Announcement'
import AppShell from '@/components/AppShell'
import { appTabs } from '@/components/tabs'
import PushConsent from '@/components/PushConsent'
import { usePushConsent } from '@/lib/push'
import { MEMBER_PUSH } from './push'
import { useMemberLogout, useMemberProfile } from './useMemberProfile'
import Splash from '@/components/Splash'

const TABS = appTabs('/member')

// 회원 화면 레이아웃 — 트레이너 화면과 같은 메뉴 구조. 회원 토큰 없으면(401) 코드 입력으로, 서버 연결 실패면 다시 시도
// 홈 화면 앱으로 처음 열면 알림 동의 화면 먼저 (한 번만)
export default function MemberLayout() {
  const profile = useMemberProfile()
  const logout = useMemberLogout()
  const push = usePushConsent(MEMBER_PUSH)

  if (profile.isPending) return <Splash />
  if (profile.isError && !isUnauthorized(profile.error)) {
    return <ConnectionError onRetry={() => void profile.refetch()} retrying={profile.isFetching} />
  }
  if (profile.isError) return <Navigate to="/member" replace />
  if (push.show) {
    return (
      <PushConsent
        title="운동일지 알림 받기"
        description={
          <>
            트레이너가 운동일지를 작성하면
            <br />
            바로 알려드려요
          </>
        }
        onDone={push.finish}
      />
    )
  }
  return (
    <>
      <AppShell tabs={TABS} userName={profile.data.name} logoutLabel="나가기" onLogout={logout} />
      <Announcement id="member-personal-workout" title="혼자 운동한 것도 기록해 보세요" actionLabel="기록하러 가기" actionTo="/member/personal">
        PT 없는 날 운동한 종목과 느낀 점을 남길 수 있어요.
        <br />
        트레이너가 보고 <span className="font-semibold text-foreground">댓글로 피드백</span>해 드려요.
      </Announcement>
    </>
  )
}
