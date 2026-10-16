import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { getMembersListQueryKey, useMembersCreate } from '@/api/generated'

// 회원 추가 후 바로 그 회원의 오늘 일지로 이동
export default function AddMemberButton({ date }: { date: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const trimmed = name.trim()
  const queryClient = useQueryClient()
  const create = useMembersCreate<Error>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trimmed || create.isPending) return
    create.mutate(
      { data: { name: trimmed, memo } },
      {
        onSuccess: async (member) => {
          await queryClient.invalidateQueries({ queryKey: getMembersListQueryKey() })
          setOpen(false)
          setName('')
          setMemo('')
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
            create.reset()
          }
        }}
      >
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>회원 추가</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-8">
            <MemberFields name={name} memo={memo} onName={setName} onMemo={setMemo} autoFocus />
            <p className="text-sm text-muted-foreground">회원 ID(6자리)는 자동으로 만들어져요</p>
            {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
            <Button type="submit" className="h-12 rounded-xl text-base" disabled={!trimmed || create.isPending}>
              추가
            </Button>
          </form>
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
