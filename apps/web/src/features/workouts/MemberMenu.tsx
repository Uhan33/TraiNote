import { useQueryClient } from '@tanstack/react-query'
import { Check, Ellipsis, Pencil, RefreshCw, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useMembersReissue, useMembersRemove, useMembersUpdate, type MemberDto } from '@/api/generated'
import { MemberFields } from './AddMemberButton'
import { useInvite } from './useInvite'

type Mode = 'menu' | 'edit' | 'reissue' | 'delete'

// 회원 초대 보내기 · 정보(이름·메모) 수정 · 코드 재발급 · 삭제(연결 해제). 재발급·삭제는 확인 단계를 한 번 더 거침
export default function MemberMenu({ member, date }: { member: MemberDto; date: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('menu')
  const [name, setName] = useState(member.name)
  const [memo, setMemo] = useState(member.memo)
  const invite = useInvite(member)
  const update = useMembersUpdate<Error>()
  const remove = useMembersRemove<Error>()
  const reissue = useMembersReissue<Error>()

  // 회원 목록·일지 목록 갱신
  const refresh = () => queryClient.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith('/api/v1/') })

  const close = () => {
    setOpen(false)
    setMode('menu')
    setName(member.name)
    setMemo(member.memo)
    update.reset()
    remove.reset()
    reissue.reset()
  }

  return (
    <>
      <Button variant="ghost" size="icon-lg" aria-label="회원 관리" className="ml-auto" onClick={() => setOpen(true)}>
        <Ellipsis className="size-5" />
      </Button>

      <Drawer open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>{{ menu: member.name, edit: '회원 정보 수정', reissue: '코드 재발급', delete: '회원 삭제' }[mode]}</DrawerTitle>
          </DrawerHeader>

          {mode === 'menu' && (
            <div className="flex flex-col px-4 pb-8">
              <button
                type="button"
                onClick={invite.send}
                className="flex h-12 items-center gap-3 rounded-lg px-2 text-left active:bg-muted"
              >
                {invite.copied ? <Check className="size-5 text-muted-foreground" /> : <Send className="size-5 text-muted-foreground" />}
                {invite.copied ? '복사했어요 · 회원에게 보내 주세요' : '회원 초대 보내기'}
              </button>
              <button type="button" onClick={() => setMode('edit')} className="flex h-12 items-center gap-3 rounded-lg px-2 text-left active:bg-muted">
                <Pencil className="size-5 text-muted-foreground" /> 회원 정보 수정
              </button>
              <button type="button" onClick={() => setMode('reissue')} className="flex h-12 items-center gap-3 rounded-lg px-2 text-left active:bg-muted">
                <RefreshCw className="size-5 text-muted-foreground" /> 코드 재발급
              </button>
              <button type="button" onClick={() => setMode('delete')} className="flex h-12 items-center gap-3 rounded-lg px-2 text-left text-destructive active:bg-muted">
                <Trash2 className="size-5" /> 회원 삭제
              </button>
            </div>
          )}

          {mode === 'edit' && (
            <form
              className="flex flex-col gap-4 px-4 pb-8"
              onSubmit={(e) => {
                e.preventDefault()
                if (!name.trim()) return
                update.mutate({ code: member.code, data: { name: name.trim(), memo } }, { onSuccess: () => void refresh().then(close) })
              }}
            >
              <MemberFields name={name} memo={memo} onName={setName} onMemo={setMemo} />
              {update.error && <p className="text-sm text-destructive">{update.error.message}</p>}
              <Button type="submit" className="h-12 rounded-xl text-base" disabled={!name.trim() || update.isPending}>
                저장
              </Button>
            </form>
          )}

          {mode === 'reissue' && (
            <div className="flex flex-col gap-4 px-4 pb-8">
              <p className="text-sm text-muted-foreground">
                새 코드를 발급하면 기존 코드(#{member.code})는 더 이상 쓸 수 없고, 기존 코드로 들어온 회원 기기는 로그아웃돼요. 운동 기록은
                그대로 유지돼요.
              </p>
              {reissue.error && <p className="text-sm text-destructive">{reissue.error.message}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="h-12 rounded-xl text-base" onClick={() => setMode('menu')}>
                  취소
                </Button>
                <Button
                  className="h-12 rounded-xl text-base"
                  disabled={reissue.isPending}
                  onClick={() =>
                    reissue.mutate(
                      { code: member.code },
                      {
                        // 주소의 회원 코드가 바뀌므로 새 코드로 이동
                        onSuccess: async (updated) => {
                          close()
                          navigate(`/workouts/${updated.code}?date=${date}`, { replace: true })
                          await refresh()
                        },
                      },
                    )
                  }
                >
                  재발급
                </Button>
              </div>
            </div>
          )}

          {mode === 'delete' && (
            <div className="flex flex-col gap-4 px-4 pb-8">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{member.name}</span> 회원을 삭제하면 목록에서 사라지고 회원 ID(#{member.code})도
                더 이상 쓸 수 없어요.
              </p>
              {remove.error && <p className="text-sm text-destructive">{remove.error.message}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="h-12 rounded-xl text-base" onClick={() => setMode('menu')}>
                  취소
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 rounded-xl text-base"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(
                      { code: member.code },
                      {
                        onSuccess: async () => {
                          close()
                          navigate(`/workouts?date=${date}`, { replace: true })
                          await refresh()
                        },
                      },
                    )
                  }
                >
                  삭제
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
