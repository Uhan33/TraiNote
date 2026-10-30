import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, MessageCircle, Pencil, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Modal from '@/components/Modal'
import { Button } from '@/components/ui/button'
import type { PersonalWorkoutCommentDto, PersonalWorkoutDto } from '@/api/generated'
import { describeSets, formatDateLabel, fromDateKey } from '@/features/workouts/data'

const PAGE_SIZE = 10 // API 와 동일

export type Viewer = 'member' | 'trainer'

// 개인운동 목록 — 회원·트레이너 화면 공용. 월별·날짜별 한 줄씩(최신순 무한 스크롤), 누르면 가운데 창에 본문·댓글
export default function PersonalFeed({
  queryKey,
  fetchPage,
  viewer,
  memberName,
  addComment,
  removeComment,
  onEdit,
  markRead,
  empty,
}: {
  queryKey: string
  fetchPage: (before?: string) => Promise<PersonalWorkoutDto[]>
  viewer: Viewer
  memberName: string
  addComment: (date: string, content: string) => Promise<unknown>
  removeComment: (date: string, id: string) => Promise<unknown>
  onEdit?: (date: string) => void
  // 트레이너: 안 읽은 기록을 열면 읽음 처리
  markRead?: (date: string) => Promise<unknown>
  empty: ReactNode
}) {
  const queryClient = useQueryClient()
  const list = useInfiniteQuery({
    queryKey: [queryKey],
    queryFn: ({ pageParam }) => fetchPage(pageParam || undefined),
    initialPageParam: '',
    getNextPageParam: (last) => (last.length === PAGE_SIZE ? last.at(-1)?.date : undefined),
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: [queryKey] })

  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && !isFetchingNextPage && void fetchNextPage(), {
      rootMargin: '400px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const all = list.data?.pages.flat() ?? []
  const months = new Map<string, PersonalWorkoutDto[]>()
  for (const w of all) months.set(w.date.slice(0, 7), [...(months.get(w.date.slice(0, 7)) ?? []), w])
  // 연 날짜 — 닫히는 애니메이션 동안 내용이 남아 있도록 open 과 따로 둠. 댓글을 달면 목록을 새로 받아 창에도 반영
  const [openDate, setOpenDate] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const selected = all.find((w) => w.date === openDate)

  return (
    <div className="flex flex-col">
      {list.isSuccess && all.length === 0 && empty}
      {[...months].map(([month, items]) => (
        <section key={month} className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {fromDateKey(`${month}-01`).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {items.map((w) => (
              <li key={w.date}>
                <PersonalRow
                  workout={w}
                  unread={!!markRead && w.unread}
                  onOpen={() => {
                    setOpenDate(w.date)
                    setOpen(true)
                    // 실패해도 다음에 열 때 다시 시도 — 목록·회원별 수는 성공했을 때만 갱신
                    if (markRead && w.unread) {
                      void markRead(w.date).then(() =>
                        queryClient.invalidateQueries({
                          predicate: (q) => q.queryKey[0] === queryKey || q.queryKey[0] === '/api/v1/personal-workouts/unread',
                        }),
                      )
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div ref={sentinel} />
      {(list.isPending || list.isFetchingNextPage) && <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중…</p>}
      {list.isError && (
        <button type="button" onClick={() => void list.refetch()} className="w-full py-6 text-center text-sm text-destructive">
          불러오지 못했어요 · 다시 시도
        </button>
      )}

      <Modal open={open && !!selected} onOpenChange={setOpen}>
        {selected && (
          <PersonalCard
            workout={selected}
            viewer={viewer}
            memberName={memberName}
            onEdit={onEdit}
            onAddComment={async (content) => {
              await addComment(selected.date, content)
              await refresh()
            }}
            onRemoveComment={async (id) => {
              await removeComment(selected.date, id)
              await refresh()
            }}
          />
        )}
      </Modal>
    </div>
  )
}

// 목록 한 줄 — 날짜, 종목 이름, 본문 첫 줄, 댓글 수. unread: 빨간 점
function PersonalRow({ workout, unread, onOpen }: { workout: PersonalWorkoutDto; unread: boolean; onOpen: () => void }) {
  const names = workout.exercises.map((e) => e.name).join(', ')
  const firstLine = workout.content.split('\n')[0]
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left active:bg-muted md:hover:bg-muted/60">
      <span className="w-14 shrink-0 font-semibold">
        {fromDateKey(workout.date).toLocaleDateString('ko-KR', { day: 'numeric' })}
        <span className="block text-xs font-normal text-muted-foreground">
          {fromDateKey(workout.date).toLocaleDateString('ko-KR', { weekday: 'long' })}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{names || firstLine}</span>
        {names && firstLine && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{firstLine}</span>}
      </span>
      {workout.comments.length > 0 && (
        <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
          <MessageCircle className="size-4" /> {workout.comments.length}
        </span>
      )}
      {unread && <span aria-label="새 기록" className="size-2 shrink-0 rounded-full bg-red-500" />}
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  )
}

function PersonalCard({
  workout,
  viewer,
  memberName,
  onEdit,
  onAddComment,
  onRemoveComment,
}: {
  workout: PersonalWorkoutDto
  viewer: Viewer
  memberName: string
  onEdit?: (date: string) => void
  onAddComment: (content: string) => Promise<void>
  onRemoveComment: (id: string) => Promise<void>
}) {
  return (
    <article className="p-5">
      <div className="flex items-center gap-1">
        <Dialog.Title className="flex-1 text-lg font-semibold">{formatDateLabel(workout.date)}</Dialog.Title>
        {onEdit && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(workout.date)}>
            <Pencil /> 수정
          </Button>
        )}
        <Dialog.Close asChild>
          <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-2 text-muted-foreground">
            <X />
          </Button>
        </Dialog.Close>
      </div>

      {workout.exercises.length > 0 && (
        // 종목은 회색 상자 — 아래 본문과 구분
        <ul className="mt-3 flex flex-col gap-2 rounded-xl bg-muted p-3">
          {workout.exercises.map((exercise, i) => (
            <li key={i} className="flex items-start justify-between gap-4 text-sm">
              <span className="shrink-0 font-medium">{exercise.name}</span>
              <span className="flex flex-col text-right text-muted-foreground">
                {describeSets(exercise).map((line, j) => (
                  <span key={j}>{line}</span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {workout.content && <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">{workout.content}</p>}

      <Comments comments={workout.comments} viewer={viewer} memberName={memberName} onAdd={onAddComment} onRemove={onRemoveComment} />
    </article>
  )
}

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function Comments({
  comments,
  viewer,
  memberName,
  onAdd,
  onRemove,
}: {
  comments: PersonalWorkoutCommentDto[]
  viewer: Viewer
  memberName: string
  onAdd: (content: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    setSending(true)
    setError(false)
    try {
      await onAdd(text.trim())
      setText('')
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-4 border-t pt-3">
      {comments.length > 0 && (
        <ul className="mb-3 flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className={`font-semibold ${c.author === 'trainer' ? 'text-primary' : ''}`}>{c.author === 'trainer' ? '트레이너' : memberName}</span>
                <span className="text-xs text-muted-foreground">{timeLabel(c.createdAt)}</span>
                {c.author === viewer && (
                  <button type="button" onClick={() => void onRemove(c.id)} className="ml-auto text-xs text-muted-foreground active:underline">
                    삭제
                  </button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={viewer === 'trainer' ? '피드백 남기기' : '댓글 남기기'}
          maxLength={1000}
          rows={1}
          className="field-sizing-content max-h-32 min-h-10 flex-1 resize-none rounded-xl border bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button className="h-10 rounded-xl" disabled={!text.trim() || sending} onClick={() => void submit()}>
          등록
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">등록하지 못했어요. 다시 눌러 주세요</p>}
    </div>
  )
}
