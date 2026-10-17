import { useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { getMembersListQueryKey, useMembersCreate, type MemberDto } from '@/api/generated'
import { PtInput } from './pt'
import { useInvite } from './useInvite'

// 회원 추가 후 그 회원의 오늘 일지로 이동하고, 같은 창에서 바로 초대 보내기 단계로 전환
export default function AddMemberButton({ date }: { date: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [pt, setPt] = useState('')
  const trimmed = name.trim()
  const queryClient = useQueryClient()
  const create = useMembersCreate<Error>()
  const [added, setAdded] = useState<MemberDto | null>(null)
  const invite = useInvite(added)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trimmed || create.isPending) return
    create.mutate(
      { data: { name: trimmed, memo, ptRemaining: pt ? Number(pt) : undefined } },
      {
        onSuccess: async (member) => {
          await queryClient.invalidateQueries({ queryKey: getMembersListQueryKey() })
          setAdded(member)
          setName('')
          setMemo('')
          setPt('')
          navigate(`/workouts/${member.code}?date=${date}`)
        },
      },
    )
  }

  return (
    <>
      <Button variant="secondary" className="h-10 rounded-full px-4" onClick={() => setOpen(true)}>
        <Plus /> 회원 추가
      </Button>

      <Drawer
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) {
            setName('')
            setMemo('')
            setPt('')
            setAdded(null)
            create.reset()
          }
        }}
      >
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>{added ? `${added.name}님을 추가했어요` : '회원 추가'}</DrawerTitle>
          </DrawerHeader>
          {added ? (
            <div className="flex flex-col gap-4 px-4 pb-8">
              <p className="text-sm text-muted-foreground">초대를 보내면 회원이 가입 없이 코드로 들어와 운동 기록을 볼 수 있어요.</p>
              <div className="rounded-xl bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">회원 코드</p>
                <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.2em]">{added.code}</p>
              </div>
              <Button className="h-12 rounded-xl text-base" onClick={invite.send}>
                {invite.copied ? <Check /> : <Send />}
                {invite.copied ? '복사했어요 · 회원에게 보내 주세요' : '초대 보내기'}
              </Button>
              <Button variant="ghost" className="h-12 rounded-xl text-base" onClick={() => setOpen(false)}>
                나중에 할게요
              </Button>
              <p className="text-center text-xs text-muted-foreground">나중에 일지 화면 오른쪽 위 ⋯ 메뉴에서도 보낼 수 있어요</p>
            </div>
          ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-8">
            <MemberFields name={name} memo={memo} onName={setName} onMemo={setMemo} autoFocus />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                남은 PT 횟수 <span className="font-normal text-muted-foreground">(선택 · 일지를 쓸 때마다 1회씩 차감)</span>
              </span>
              <PtInput value={pt} onChange={setPt} />
            </div>
            <p className="text-sm text-muted-foreground">회원 ID(6자리)는 자동으로 만들어져요</p>
            {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
            <Button type="submit" className="h-12 rounded-xl text-base" disabled={!trimmed || create.isPending}>
              추가
            </Button>
          </form>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

// 회원 추가·수정 공용 입력칸
export function MemberFields({
  name,
  memo,
  onName,
  onMemo,
  autoFocus,
}: {
  name: string
  memo: string
  onName: (v: string) => void
  onMemo: (v: string) => void
  autoFocus?: boolean
}) {
  return (
    <>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">이름</span>
        <Input
          autoFocus={autoFocus}
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={20}
          placeholder="예: 홍길동"
          className="h-12 text-base md:text-base"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          메모 <span className="font-normal text-muted-foreground">(선택 · 트레이너만 보여요)</span>
        </span>
        <textarea
          value={memo}
          onChange={(e) => onMemo(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="예: 오전반 · 무릎 부상 이력 · 목표 -5kg"
          className="w-full resize-none rounded-lg border border-input bg-transparent p-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </label>
    </>
  )
}
