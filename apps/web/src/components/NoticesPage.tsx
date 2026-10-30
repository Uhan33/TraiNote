import { Dialog } from 'radix-ui'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { getMemberViewNoticesQueryKey, getNoticesListQueryKey, memberViewMarkNoticeRead, noticesMarkRead, useMemberViewNotices, useNoticesList } from '@/api/generated'
import { formatDateLabel } from '@/features/workouts/data'
import Modal from './Modal'

const fullDate = (key: string) => `${key.slice(0, 4)}년 ${formatDateLabel(key)}`

// 내 정보 > 공지사항 — 트레이너·회원 공용 (글은 DB, 대상별로 받음). 누르면 가운데 창에 본문
// 본문: 빈 줄로 문단 구분, '· ' 로 시작하는 문단은 목록
export default function NoticesPage({ audience, backTo }: { audience: 'trainer' | 'member'; backTo: string }) {
  const navigate = useNavigate()
  const trainer = useNoticesList({ query: { enabled: audience === 'trainer' } })
  const member = useMemberViewNotices({ query: { enabled: audience === 'member' } })
  const query = audience === 'trainer' ? trainer : member
  const notices = query.data ?? []
  const queryClient = useQueryClient()
  // 열면 읽음 — 내 정보의 안 읽은 수도 같은 목록에서 셈
  const markRead = async (id: string) => {
    await (audience === 'trainer' ? noticesMarkRead(id) : memberViewMarkNoticeRead(id))
    await queryClient.invalidateQueries({ queryKey: audience === 'trainer' ? getNoticesListQueryKey() : getMemberViewNoticesQueryKey() })
  }
  const [openId, setOpenId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const selected = notices.find((n) => n.id === openId)

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col">
      <header className="flex h-14 items-center gap-1 border-b px-2 lg:px-6">
        <Button variant="ghost" size="icon-lg" aria-label="내 정보" onClick={() => navigate(backTo)}>
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="text-lg font-semibold">공지사항</h1>
      </header>
      <ul className="divide-y px-1 lg:px-4">
        {notices.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => {
                setOpenId(n.id)
                setOpen(true)
                if (!n.read) void markRead(n.id).catch(() => {}) // 실패하면 다음에 열 때 다시
              }}
              className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-muted md:hover:bg-muted/60"
            >
              <span className="min-w-0 flex-1">
                <span className={`block truncate ${n.read ? '' : 'font-semibold'}`}>{n.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{fullDate(n.date)}</span>
              </span>
              {!n.read && <span aria-label="안 읽음" className="size-2 shrink-0 rounded-full bg-red-500" />}
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      {query.isPending && <p className="py-16 text-center text-muted-foreground">불러오는 중…</p>}
      {query.isError && <p className="py-16 text-center text-destructive">불러오지 못했어요</p>}
      {query.isSuccess && notices.length === 0 && <p className="py-16 text-center text-muted-foreground">공지사항이 없어요</p>}

      <Modal open={open && !!selected} onOpenChange={setOpen}>
        {selected && (
          <article className="p-6">
            <div className="flex items-start gap-2">
              <Dialog.Title className="flex-1 text-lg font-bold">{selected.title}</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="닫기" className="-mt-1 -mr-2 text-muted-foreground">
                  <X />
                </Button>
              </Dialog.Close>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{fullDate(selected.date)}</p>
            <div className="mt-5 flex flex-col gap-4 text-[15px] leading-relaxed">
              {selected.body.split(/\n\s*\n/).map((para, i) =>
                para.startsWith('· ') ? (
                  <ul key={i} className="flex flex-col gap-1.5 rounded-xl bg-muted p-4 text-sm">
                    {para.split('\n').map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="text-muted-foreground">·</span>
                        {line.slice(2)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{para}</p>
                ),
              )}
            </div>
          </article>
        )}
      </Modal>
    </div>
  )
}
