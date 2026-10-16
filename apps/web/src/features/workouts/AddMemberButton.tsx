import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { addMember } from './data'

const NAME_MAX = 20

// 회원 추가 후 바로 그 회원의 오늘 일지로 이동
export default function AddMemberButton({ date }: { date: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const trimmed = name.trim()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trimmed) return
    const member = addMember(trimmed)
    setOpen(false)
    setName('')
    navigate(`/workouts/${member.id}?date=${date}`)
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
          if (!o) setName('')
        }}
      >
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>회원 추가</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-8">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">이름</span>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={NAME_MAX}
                placeholder="예: 홍길동"
                className="h-12 text-base md:text-base"
              />
            </label>
            <p className="text-sm text-muted-foreground">회원 ID(6자리)는 자동으로 만들어져요</p>
            <Button type="submit" className="h-12 rounded-xl text-base" disabled={!trimmed}>
              추가
            </Button>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  )
}
