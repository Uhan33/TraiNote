import { ClipboardCheck } from 'lucide-react'

// 회원 숙제 (/member/homework) — 숙제 기능 전까지는 빈 상태로 안내
export default function MemberHomeworkPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <ClipboardCheck className="size-10 text-muted-foreground/50" />
      <p className="font-medium">아직 받은 숙제가 없어요</p>
      <p className="text-sm text-muted-foreground">트레이너가 숙제를 내주면 여기에서 확인할 수 있어요</p>
    </div>
  )
}
