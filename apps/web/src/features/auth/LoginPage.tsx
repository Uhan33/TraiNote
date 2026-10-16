import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAuthMeQueryKey, useAuthLogin } from '@/api/generated'
import AuthLayout, { Field, inputClass } from './AuthLayout'

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const login = useAuthLogin<Error>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate(
      { data: { loginId, password } },
      {
        onSuccess: (trainer) => {
          queryClient.setQueryData(getAuthMeQueryKey(), trainer)
          navigate(params.get('next') ?? '/workouts', { replace: true })
        },
      },
    )
  }

  return (
    <AuthLayout title="로그인" subtitle="회원 운동일지를 관리해 보세요">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="아이디">
          <Input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" autoCapitalize="none" required className={inputClass} />
        </Field>
        <Field label="비밀번호">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={inputClass} />
        </Field>
        {login.error && <p className="text-sm text-destructive">{login.error.message}</p>}
        <Button type="submit" className="mt-2 h-12 rounded-xl text-base" disabled={login.isPending}>
          로그인
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        처음이신가요?{' '}
        <Link to="/signup" className="font-semibold text-foreground underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </AuthLayout>
  )
}
