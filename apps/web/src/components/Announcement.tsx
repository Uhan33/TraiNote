import { Dialog } from 'radix-ui'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import Modal from './Modal'
import { Button } from './ui/button'

const SEEN_KEY = 'trainote.notice:'

const seen = (id: string) => {
  try {
    return localStorage.getItem(SEEN_KEY + id) === '1'
  } catch {
    return false
  }
}

// 새 기능 공지 — 기기마다 한 번. 닫거나 버튼을 누르면 다시 안 뜸. 다음 공지는 id·내용만 바꿔서
export default function Announcement({ id, title, children, actionLabel, actionTo }: { id: string; title: string; children: ReactNode; actionLabel: string; actionTo: string }) {
  const [open, setOpen] = useState(() => !seen(id))
  const navigate = useNavigate()
  const close = () => {
    setOpen(false)
    try {
      localStorage.setItem(SEEN_KEY + id, '1')
    } catch {
      // 저장 못 하면 다음에 한 번 더 보임
    }
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && close()}>
      <div className="p-6">
        <span className="inline-block rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">NEW</span>
        <Dialog.Title className="mt-3 text-xl font-bold">{title}</Dialog.Title>
        <div className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            className="h-12 rounded-xl text-base"
            onClick={() => {
              close()
              navigate(actionTo)
            }}
          >
            {actionLabel}
          </Button>
          <Button variant="ghost" className="h-11 rounded-xl text-muted-foreground" onClick={close}>
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  )
}
