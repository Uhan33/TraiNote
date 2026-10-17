import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 서버에 닿지 못함(네트워크·서버 재시작·잠든 서버 깨우는 중) — 로그인이 풀린 게 아니므로 로그인 화면으로 보내지 않음
export default function ConnectionError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <WifiOff className="size-10 text-muted-foreground" />
      <h1 className="mt-4 text-lg font-bold">서버에 연결할 수 없어요</h1>
      <p className="mt-1 text-sm text-muted-foreground">인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요.</p>
      <Button variant="secondary" className="mt-6 h-11 rounded-xl px-6" disabled={retrying} onClick={onRetry}>
        {retrying ? '연결 중…' : '다시 시도'}
      </Button>
    </main>
  )
}
