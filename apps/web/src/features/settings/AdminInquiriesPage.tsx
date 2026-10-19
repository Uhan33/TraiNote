import { useQueryClient } from '@tanstack/react-query'
import { BellRing, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  getAdminInquiriesListQueryKey,
  useAdminInquiriesAnswer,
  useAdminInquiriesList,
  type AdminInquiryDto,
} from '@/api/generated'
import { pushSupported, subscribe } from '@/lib/push'
import { TRAINER_PUSH } from './push'
import { isUnauthorized } from '@/api/fetcher'
import { categoryLabel } from './inquiry'

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

// 운영자 문의 관리 (trainer.role = admin) — 내 정보에서만 진입, 실제 차단은 서버 AdminGuard
export default function AdminInquiriesPage() {
  const navigate = useNavigate()
  const inquiries = useAdminInquiriesList<AdminInquiryDto[], Error>({ query: { retry: false } })
  const [filter, setFilter] = useState<'waiting' | 'all'>('waiting')
  const waiting = inquiries.data?.filter((i) => i.answer === null) ?? []
  const shown = filter === 'waiting' ? waiting : (inquiries.data ?? [])

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col">
      <header className="flex h-14 items-center gap-1 border-b px-2 lg:px-6">
        <Button variant="ghost" size="icon-lg" aria-label="내 정보" onClick={() => navigate('/settings')}>
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="text-lg font-semibold">문의 관리</h1>
      </header>

      <div className="flex flex-col gap-3 px-5 pt-5 pb-10 lg:px-8">
        <AdminPushRow />
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ['waiting', `답변 대기 ${waiting.length}`],
              ['all', `전체 ${inquiries.data?.length ?? 0}`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`h-9 rounded-lg text-sm ${filter === value ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {inquiries.isPending && <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>}
        {inquiries.isError && (
          <p className="py-16 text-center text-destructive">
            {isUnauthorized(inquiries.error) ? '로그인이 필요해요' : (inquiries.error.message ?? '문의를 불러오지 못했어요')}
          </p>
        )}
        {inquiries.isSuccess && shown.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">{filter === 'waiting' ? '답변할 문의가 없어요' : '문의가 없어요'}</p>
        )}
        {shown.map((inquiry) => (
          <AdminInquiryItem key={inquiry.id} inquiry={inquiry} />
        ))}
      </div>
    </div>
  )
}

function AdminInquiryItem({ inquiry }: { inquiry: AdminInquiryDto }) {
  const queryClient = useQueryClient()
  const [answer, setAnswer] = useState(inquiry.answer ?? '')
  const save = useAdminInquiriesAnswer<Error>({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminInquiriesListQueryKey() }) },
  })
  const trimmed = answer.trim()
  const changed = trimmed !== '' && trimmed !== (inquiry.answer ?? '')

  return (
    <article className="flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${inquiry.answer !== null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {inquiry.answer !== null ? '답변 완료' : '답변 대기'}
        </span>
        <span className="text-muted-foreground">
          {categoryLabel(inquiry.category)} · {formatDateTime(inquiry.createdAt)}
        </span>
      </div>
      <div>
        <h2 className="font-semibold">{inquiry.title}</h2>
        <p className="text-xs text-muted-foreground">
          {inquiry.trainerName} ({inquiry.trainerLoginId}){inquiry.contact && ` · 연락처 ${inquiry.contact}`}
        </p>
      </div>
      <p className="text-sm whitespace-pre-wrap">{inquiry.content}</p>
      <p className="truncate text-[11px] text-muted-foreground" title={inquiry.userAgent}>
        v{inquiry.appVersion || '?'} · {inquiry.userAgent || '기기 정보 없음'}
      </p>

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (changed) save.mutate({ id: inquiry.id, data: { answer: trimmed } })
        }}
      >
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="답변을 입력하면 트레이너의 문의 내역에 바로 보여요"
          className="w-full resize-none rounded-lg border border-input bg-transparent p-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
        <div className="flex items-center justify-end gap-3">
          {inquiry.answeredAt && <span className="text-xs text-muted-foreground">{formatDateTime(inquiry.answeredAt)} 답변</span>}
          <Button type="submit" className="h-10 rounded-xl px-5" disabled={!changed || save.isPending}>
            {inquiry.answer !== null ? '답변 수정' : '답변 등록'}
          </Button>
        </div>
      </form>
    </article>
  )
}

// 이 기기로 새 문의 알림 받기 (트레이너 알림 구독과 같음 — PC 브라우저에서도 켤 수 있게)
// 허용된 기기의 재등록은 RequireAuth(usePushConsent)가 앱을 열 때마다
// (아이폰은 홈 화면 앱에서만 가능. 끄기·차단 해제는 휴대폰·브라우저 설정)
function AdminPushRow() {
  const [permission, setPermission] = useState<NotificationPermission>(pushSupported ? Notification.permission : 'denied')
  const [error, setError] = useState('')

  const enable = async () => {
    setError('')
    try {
      const result = await Notification.requestPermission() // 버튼을 누른 직후에 바로 (아이폰)
      setPermission(result)
      if (result === 'granted') await subscribe(TRAINER_PUSH, true)
    } catch {
      setError('알림을 켜지 못했어요')
    }
  }

  const status = !pushSupported
    ? '이 기기는 알림을 받을 수 없어요 (아이폰은 홈 화면 앱에서)'
    : permission === 'granted'
      ? '이 기기로 새 문의 알림을 받고 있어요'
      : permission === 'denied'
        ? '알림이 차단돼 있어요. 기기 설정에서 TraiNote 알림을 허용해 주세요'
        : '새 문의가 등록되면 이 기기로 알려드려요'

  return (
    <section className="flex items-center gap-3 rounded-2xl border p-4">
      <BellRing className={`size-5 shrink-0 ${permission === 'granted' ? '' : 'text-muted-foreground'}`} />
      <p className={`min-w-0 flex-1 text-sm ${error ? 'text-destructive' : 'text-muted-foreground'}`}>{error || status}</p>
      {pushSupported && permission === 'default' && (
        <Button className="h-9 shrink-0 rounded-lg" onClick={() => void enable()}>
          알림 받기
        </Button>
      )}
    </section>
  )
}
