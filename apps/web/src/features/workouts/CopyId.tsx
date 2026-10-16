import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

// 누르면 ID 복사. Clipboard API 는 https·localhost 에서만 동작(배포 환경은 https)
export default function CopyId({ id }: { id: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
    setTimeout(() => setStatus('idle'), 1500)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`회원 ID ${id} 복사`}
      className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted active:bg-muted"
    >
      #{id}
      {status === 'copied' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {status !== 'idle' && <span aria-live="polite">{status === 'copied' ? '복사됨' : '복사 실패'}</span>}
    </button>
  )
}
