import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthMe } from '@/api/generated'

// 로그인 필요한 화면 묶음. 미로그인 → /login?next=현재경로
export default function RequireAuth() {
  const location = useLocation()
  const me = useAuthMe({ query: { retry: false, staleTime: Infinity } })

  if (me.isPending) return null
  if (me.isError) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Outlet />
}

// 로그인 상태로 로그인·가입 화면에 오면 앱으로
export function GuestOnly() {
  const me = useAuthMe({ query: { retry: false, staleTime: Infinity } })
  if (me.isPending) return null
  if (me.isSuccess) return <Navigate to="/workouts" replace />
  return <Outlet />
}
