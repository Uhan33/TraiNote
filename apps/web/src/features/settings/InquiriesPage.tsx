import { ChevronDown, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { useInquiriesList, type InquiryDto } from '@/api/generated'
import { categoryLabel } from './inquiry'

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

// 내 정보 > 문의 내역 — 보낸 문의(최신순)와 운영자 답변
export default function InquiriesPage() {
  const navigate = useNavigate()
  const inquiries = useInquiriesList()

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col">
      <header className="flex h-14 items-center gap-1 border-b px-2 lg:px-6">
        <Button variant="ghost" size="icon-lg" aria-label="내 정보" onClick={() => navigate('/settings')}>
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="text-lg font-semibold">문의 내역</h1>
      </header>

      <div className="flex flex-col gap-3 px-5 pt-5 pb-10 lg:px-8">
        {inquiries.isPending && <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>}
        {inquiries.isError && <p className="py-16 text-center text-destructive">문의 내역을 불러오지 못했어요</p>}
        {inquiries.isSuccess && inquiries.data.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-muted-foreground">보낸 문의가 없어요</p>
            <Link to="/settings/inquiry" className={buttonVariants({ variant: 'secondary', className: 'mt-4 h-11 rounded-xl px-6' })}>
              문의하기
            </Link>
          </div>
        )}
        {inquiries.data?.map((inquiry) => <InquiryItem key={inquiry.id} inquiry={inquiry} />)}
      </div>
    </div>
  )
}

// 누르면 내용·답변 펼침 — 답변이 있는 문의는 처음부터 펼쳐 둠
function InquiryItem({ inquiry }: { inquiry: InquiryDto }) {
  const answered = inquiry.answer !== null
  const [open, setOpen] = useState(answered)

  return (
    <article className="rounded-2xl border">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-start gap-3 p-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${answered ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {answered ? '답변 완료' : '답변 대기'}
            </span>
            <span className="text-muted-foreground">
              {categoryLabel(inquiry.category)} · {formatDate(inquiry.createdAt)}
            </span>
          </span>
          <span className="mt-2 block font-semibold">{inquiry.title}</span>
        </span>
        <ChevronDown className={`mt-1 size-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{inquiry.content}</p>
          {answered ? (
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs font-semibold">TraiNote 답변 · {formatDate(inquiry.answeredAt!)}</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{inquiry.answer}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">확인 후 답변드릴게요.</p>
          )}
        </div>
      )}
    </article>
  )
}
