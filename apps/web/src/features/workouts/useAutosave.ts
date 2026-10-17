import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error'

// 한글 조합 중 멈칫하는 동안은 저장하지 않도록 넉넉히. 앱 전환·화면 이동 시에는 기다리지 않고 바로 저장
const DELAY_MS = 2000

// 입력이 멈추면 저장. 저장은 한 번에 하나씩 순서대로(늦게 끝난 요청이 최신 값을 덮어쓰지 않게),
// 저장 중 들어온 변경은 끝난 뒤 이어서 저장. 화면을 떠나거나 다른 앱으로 넘어갈 때 남은 변경도 바로 저장.
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
    // 다른 앱(카톡 등)으로 넘어가면 즉시 저장 — 폰은 백그라운드 브라우저를 예고 없이 종료할 수 있음
    const flush = () => {
      if (document.visibilityState === 'hidden' && pending.current) void run()
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('visibilitychange', flush)
      if (pending.current) void run() // 다른 회원·날짜로 이동 시 즉시 저장
    }
  }, [run])

  return { status, queue, retry: run }
}
