import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { authLogout } from '@/api/generated'

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return async () => {
    await authLogout().catch(() => {}) // 실패해도 화면은 로그아웃 처리
    queryClient.clear()
    navigate('/login', { replace: true })
  }
}
