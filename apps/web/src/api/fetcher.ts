// orval 생성 코드가 모든 API 호출에 쓰는 fetch
// - 쿠키(httpOnly 토큰) 포함, 같은 출처 /api (개발: vite proxy, 배포: 도메인.com/api 프록시)
// - 액세스 토큰 만료(401) 시 refresh 1회 후 원래 요청 재시도. 동시 401 은 refresh 한 번으로 공유
// - refresh 가 서버에 닿지 못하면(네트워크·서버 다운) 401 이 아니라 연결 오류로 — 로그인이 풀린 것으로 오해하지 않게
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(apiErrorMessage(body) ?? `요청 실패 (${status})`)
    this.status = status
    this.body = body
  }

  // 409 중복 응답의 필드 (loginId / email)
  get field(): string | undefined {
    return (this.body as { field?: string } | null)?.field
  }
}

// 로그인(또는 회원 코드)이 필요한 상태(401)인지. 그 외 오류는 연결·서버 문제 — 로그인 화면으로 보내지 않음
export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401

function apiErrorMessage(body: unknown): string | undefined {
  const message = (body as { message?: string | string[] } | null)?.message
  return Array.isArray(message) ? message[0] : message
}

type RefreshResult = 'ok' | 'expired' | 'unreachable'
let refreshing: Promise<RefreshResult> | null = null

const refresh = () =>
  (refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((res): RefreshResult => (res.ok ? 'ok' : res.status === 401 ? 'expired' : 'unreachable'))
    .catch((): RefreshResult => 'unreachable')
    .finally(() => (refreshing = null)))

// 토큰 발급·갱신 요청 자체, 회원 API(회원 토큰은 갱신 없음)는 재시도 대상 아님
const NO_RETRY = ['/api/auth/login', '/api/auth/signup', '/api/auth/refresh', '/api/auth/logout', '/api/v1/member/']

export async function customFetch<T>(url: string, options: RequestInit): Promise<T> {
  const send = () => fetch(url, { ...options, credentials: 'include' })

  let res = await send()
  if (res.status === 401 && !NO_RETRY.some((path) => url.startsWith(path))) {
    const result = await refresh()
    if (result === 'unreachable') throw new ApiError(503, { message: '서버에 연결할 수 없어요' })
    if (result === 'ok') res = await send()
  }

  const text = await res.text()
  const body: unknown = text ? JSON.parse(text) : undefined
  if (!res.ok) throw new ApiError(res.status, body)
  return body as T
}
