import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error'

const DELAY_MS = 700

// 입력이 멈추면 저장. 저장은 한 번에 하나씩 순서대로(늦게 끝난 요청이 최신 값을 덮어쓰지 않게),
// 저장 중 들어온 변경은 끝난 뒤 이어서 저장. 화면을 떠날 때 남은 변경도 저장.
export function useAutosave<T>(save: (value: T) => Promise<void>) {
  const [status, setStatus] = useState<SaveStatus>('saved')
  const saveRef = useRef(save)
  const pending = useRef<{ value: T } | null>(null)
  const running = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    saveRef.current = save
  })

  const run = useCallback(async () => {
    window.clearTimeout(timer.current)
    if (running.current) return
    running.current = true
    while (pending.current) {
      const { value } = pending.current
      pending.current = null
      setStatus('saving')
      try {
        await saveRef.current(value)
      } catch {
        pending.current ??= { value } // 실패한 값 보존 — 다음 입력이나 "다시 시도" 때 재전송
        running.current = false
        setStatus('error')
        return
      }
    }
    running.current = false
    setStatus('saved')
  }, [])

  const queue = useCallback(
    (value: T) => {
      pending.current = { value }
      setStatus('pending')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(run, DELAY_MS)
    },
    [run],
  )

  useEffect(() => {
    // 저장 안 된 변경이 있으면 탭 닫기·새로고침 전에 경고
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current || running.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      if (pending.current) void run() // 다른 회원·날짜로 이동 시 즉시 저장
    }
  }, [run])

  return { status, queue, retry: run }
}
