import { ChevronLeft, CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthMe, useInquiriesCreate, type CreateInquiryDtoCategory } from '@/api/generated'

const CATEGORIES: { value: CreateInquiryDtoCategory; label: string }[] = [
  { value: 'usage', label: '사용 방법' },
  { value: 'bug', label: '오류 신고' },
  { value: 'feature', label: '기능 제안' },
  { value: 'etc', label: '기타' },
]

const TITLE_MAX = 100
const CONTENT_MAX = 2000

// 내 정보 > 문의하기 — 운영자가 DB 에서 확인. 답변은 남긴 연락처로
export default function InquiryPage() {
  const navigate = useNavigate()
  const me = useAuthMe({ query: { staleTime: Infinity } })
  const create = useInquiriesCreate<Error>()
  const [category, setCategory] = useState<CreateInquiryDtoCategory | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  // 가입 때 이메일을 남겼으면 기본값으로
  const [contact, setContact] = useState<string | null>(null)
  const contactValue = contact ?? me.data?.email ?? ''
  const valid = category !== null && title.trim() !== '' && content.trim() !== ''

  if (create.isSuccess) {
    return (
      <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <CircleCheck className="size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">문의를 보냈어요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {contactValue ? '확인 후 남겨 주신 연락처로 답변드릴게요.' : '보내 주신 내용은 서비스 개선에 참고할게요.'}
        </p>
        <Link to="/settings" className={buttonVariants({ variant: 'secondary', className: 'mt-8 h-12 rounded-xl px-8 text-base' })}>
          확인
        </Link>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col">
      <header className="flex h-14 items-center gap-1 border-b px-2 lg:px-6">
        <Button variant="ghost" size="icon-lg" aria-label="내 정보" onClick={() => navigate('/settings')}>
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="text-lg font-semibold">문의하기</h1>
      </header>

      <form
        className="flex flex-col gap-5 px-5 pt-5 pb-10 lg:px-8"
        onSubmit={(e) => {
          e.preventDefault()
          if (!category || !valid || create.isPending) return
          create.mutate({ data: { category, title: title.trim(), content: content.trim(), contact: contactValue.trim(), appVersion: __APP_VERSION__ } })
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-sm font-medium">문의 유형</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={category === c.value}
                onClick={() => setCategory(c.value)}
                className={`h-11 rounded-xl border text-sm transition-colors ${
                  category === c.value ? 'border-foreground bg-foreground font-semibold text-background' : 'active:bg-muted'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">제목</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="예: 회원 추가 버튼이 눌리지 않아요"
            className="h-12 text-base md:text-base"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between text-sm font-medium">
            내용
            <span className="text-xs font-normal text-muted-foreground">
              {content.length}/{CONTENT_MAX}
            </span>
          </span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={CONTENT_MAX}
            rows={8}
            placeholder={'오류라면 어떤 화면에서 무엇을 눌렀을 때 생겼는지 적어 주시면 빨리 고칠 수 있어요.'}
            className="w-full resize-none rounded-lg border border-input bg-transparent p-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            답변 받을 연락처 <span className="font-normal text-muted-foreground">(선택 · 이메일 또는 전화번호)</span>
          </span>
          <Input
            value={contactValue}
            onChange={(e) => setContact(e.target.value)}
            maxLength={100}
            placeholder="예: trainer@example.com"
            className="h-12 text-base md:text-base"
          />
        </label>

        <p className="text-xs text-muted-foreground">오류 확인을 위해 사용 중인 기기의 브라우저 정보와 앱 버전이 함께 전송돼요.</p>
        {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
        <Button type="submit" className="h-12 rounded-xl text-base" disabled={!valid || create.isPending}>
          보내기
        </Button>
      </form>
    </div>
  )
}
