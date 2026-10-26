import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/api/fetcher'
import { getAuthMeQueryKey, useAuthSignup, type SignupDto } from '@/api/generated'
import AuthLayout, { Field, inputClass } from './AuthLayout'

type Errors = Partial<Record<keyof SignupDto, string>>

// 서버 규칙과 동일하게 미리 검사 (서버가 최종 검증)
function validate(form: SignupDto): Errors {
  const errors: Errors = {}
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(form.loginId)) errors.loginId = '영문·숫자·_ 4~20자로 입력하세요'
  if (form.password.length < 8 || form.password.length > 72) errors.password = '8~72자로 입력하세요'
  if (!form.name.trim()) errors.name = '이름을 입력하세요'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = '이메일 형식이 올바르지 않습니다'
  return errors
}

export default function SignupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SignupDto>({ loginId: '', password: '', name: '', email: '' })
  const [errors, setErrors] = useState<Errors>({})
  const signup = useAuthSignup<Error>()
  const set = (key: keyof SignupDto) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    signup.mutate(
      { data: { ...form, email: form.email || undefined } },
      {
        onSuccess: (trainer) => {
          queryClient.setQueryData(getAuthMeQueryKey(), trainer)
          navigate('/workouts', { replace: true })
        },
        // 아이디·이메일 중복은 해당 칸 아래에 표시
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409 && err.field) setErrors({ [err.field]: err.message })
        },
      },
    )
  }

  const generalError = signup.error && !(signup.error instanceof ApiError && signup.error.status === 409) ? signup.error.message : undefined

  return (
    <AuthLayout title="회원가입" subtitle="30초면 시작할 수 있어요">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="아이디" error={errors.loginId}>
          <Input value={form.loginId} onChange={set('loginId')} autoComplete="username" autoCapitalize="none" placeholder="영문·숫자·_ 4~20자" aria-invalid={!!errors.loginId} className={inputClass} />
        </Field>
        <Field label="비밀번호" error={errors.password}>
          <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="8자 이상" aria-invalid={!!errors.password} className={inputClass} />
        </Field>
        <Field label="이름" error={errors.name}>
          <Input value={form.name} onChange={set('name')} autoComplete="name" maxLength={50} placeholder="회원에게 보일 이름" aria-invalid={!!errors.name} className={inputClass} />
        </Field>
        <Field label="이메일 (선택)" error={errors.email}>
          <Input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="비밀번호 찾기에 사용" aria-invalid={!!errors.email} className={inputClass} />
        </Field>
        {generalError && <p className="text-sm text-destructive">{generalError}</p>}
        <Button type="submit" className="mt-2 h-12 rounded-xl text-base" disabled={signup.isPending}>
          가입하고 시작하기
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          가입하면{' '}
          <Link to="/privacy" target="_blank" className="underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의하게 돼요
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </AuthLayout>
  )
}
