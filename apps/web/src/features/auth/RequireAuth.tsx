import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthMe } from '@/api/generated'
import { isUnauthorized } from '@/api/fetcher'
import ConnectionError from '@/components/ConnectionError'
import PushConsent from '@/components/PushConsent'
import { TRAINER_PUSH } from '@/features/settings/push'
import { usePushConsent } from '@/lib/push'
import Splash from '@/components/Splash'

// 로그인 필요한 화면 묶음. 미로그인(401) → /login?next=현재경로, 서버 연결 실패 → 다시 시도 화면
// 홈 화면 앱으로 처음 열면 알림 동의 화면 먼저 (한 번만)
export default function RequireAuth() {
  const location = useLocation()
  const me = useAuthMe({ query: { retry: false, staleTime: Infinity } })
  const push = usePushConsent(TRAINER_PUSH)

  if (me.isPending) return <Splash />
  if (me.isError && !isUnauthorized(me.error)) return <ConnectionError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  if (me.isError) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (push.show) {
    return (
      <PushConsent
        title="알림 받기"
        description={
          <>
            문의 답변과 TraiNote 새 소식을
            <br />
            알림으로 알려드려요
          </>
        }
        onDone={push.finish}
      />
    )
  }
  return <Outlet />
}

// 로그인 상태로 로그인·가입 화면에 오면 앱으로
export function GuestOnly() {
  const me = useAuthMe({ query: { retry: false, staleTime: Infinity } })
  if (me.isPending) return <Splash />
  if (me.isSuccess) return <Navigate to="/workouts" replace />
  if (!isUnauthorized(me.error)) return <ConnectionError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  return <Outlet />
}
