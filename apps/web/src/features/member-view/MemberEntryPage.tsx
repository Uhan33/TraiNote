import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMemberViewCreateSession } from '@/api/generated'
import AuthLayout from '@/features/auth/AuthLayout'
import { useMemberProfile } from './useMemberProfile'
import Splash from '@/components/Splash'

// /member — 회원 코드 입력. 이미 입장한 기기면 바로 운동일지로
export default function MemberEntryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const profile = useMemberProfile()
  const [code, setCode] = useState('')
  const session = useMemberViewCreateSession<Error>()

  if (profile.isPending) return <Splash />
  if (profile.isSuccess) return <Navigate to="/member/workouts" replace />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    session.mutate(
      { data: { code } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries()
          navigate('/member/workouts', { replace: true })
        },
      },
    )
  }

  return (
    <AuthLayout title="내 운동일지 보기" subtitle="담당 트레이너에게 받은 회원 코드 6자리를 입력해 주세요">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          // 실제 코드와 겹칠 수 없는 문자로 자리만 표시 (영문·숫자 예시는 진짜 코드일 수 있음)
          placeholder="••••••"
          aria-label="회원 코드"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-16 text-center font-mono text-3xl tracking-[0.4em] uppercase placeholder:text-muted-foreground/30 md:text-3xl"
        />
        {session.error && <p className="text-sm text-destructive">{session.error.message}</p>}
        <Button type="submit" className="h-12 rounded-xl text-base" disabled={code.length !== 6 || session.isPending}>
          입장하기
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">코드는 담당 트레이너가 알려 드려요</p>
    </AuthLayout>
  )
}
