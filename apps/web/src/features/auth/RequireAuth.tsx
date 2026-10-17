import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthMe } from '@/api/generated'
import { isUnauthorized } from '@/api/fetcher'
import ConnectionError from '@/components/ConnectionError'

// 로그인 필요한 화면 묶음. 미로그인(401) → /login?next=현재경로, 서버 연결 실패 → 다시 시도 화면
export default function RequireAuth() {
  const location = useLocation()
  const me = useAuthMe({ query: { retry: false, staleTime: Infinity } })

  if (me.isPending) return null
  if (me.isError && !isUnauthorized(me.error)) return <ConnectionError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  if (me.isError) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Outlet />
}

// 로그인 상태로 로그인·가입 화면에 오면 앱으로
export function GuestOnly() {
  const me = useAuthMe({ query: { retry: false, staleTime: Infinity } })
  if (me.isPending) return null
  if (me.isSuccess) return <Navigate to="/workouts" replace />
  if (!isUnauthorized(me.error)) return <ConnectionError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  return <Outlet />
}
