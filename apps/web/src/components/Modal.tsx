import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'

// 가운데 창 — 커지며 나타나고 작아지며 사라짐. 바깥 탭·Esc·뒤 화면 어둡게·흐리게 (다크 모드에선 창을 한 단계 밝은 색으로 띄움). 제목은 children 안에 Dialog.Title 로
export default function Modal({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm duration-200 dark:bg-black/70 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          // 열자마자 첫 버튼에 포커스 테두리가 생기지 않게 (Tab 으로는 창 안 이동 그대로)
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-popover text-popover-foreground shadow-2xl duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
