import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { memberViewDeleteSession, useMemberViewMe } from '@/api/generated'
import { todayKey } from '@/features/workouts/data'

// 회원 본인 정보 (회원 토큰 쿠키로 식별). 401 = 코드 입력 필요
export const useMemberProfile = () => useMemberViewMe({ month: todayKey().slice(0, 7) }, { query: { retry: false, staleTime: 60_000 } })

export function useMemberLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return async () => {
    await memberViewDeleteSession().catch(() => {})
    queryClient.clear()
    navigate('/member', { replace: true })
  }
}
