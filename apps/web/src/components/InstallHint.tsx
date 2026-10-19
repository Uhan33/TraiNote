import { Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isStandalone } from '@/lib/pwa'

// 홈 화면 추가 안내 — 폰 브라우저로 볼 때만, 닫으면 다시 안 보임
// 안드로이드 Chrome: 설치 버튼(beforeinstallprompt) / iOS Safari: 설치 버튼이 없어 공유 → 홈 화면에 추가 안내

type InstallPrompt = Event & { prompt: () => Promise<void> }

const DISMISS_KEY = 'installHintDismissed'
let deferred: InstallPrompt | null = null
const listeners = new Set<() => void>()

// 화면이 뜨기 전에 이벤트가 올 수 있어 모듈 로드 시점부터 받아 둠
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault() // 브라우저 기본 배너 대신 우리 안내로
  deferred = e as InstallPrompt
  listeners.forEach((fn) => fn())
})

// iPadOS 는 Mac 으로 표시되므로 터치 여부로 구분
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
const isTouch = () => matchMedia('(pointer: coarse)').matches

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export default function InstallHint() {
  const [dismissed, setDismissed] = useState(readDismissed)
  const [canPrompt, setCanPrompt] = useState(deferred !== null)

  useEffect(() => {
    const update = () => setCanPrompt(deferred !== null)
    listeners.add(update)
    return () => void listeners.delete(update)
  }, [])

  if (dismissed || isStandalone() || !isTouch() || (!isIos() && !canPrompt)) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // 저장 못 해도 이번 화면에서는 닫힘
    }
  }

  return (
    <div className="mx-auto flex max-w-md items-center gap-3 border-b px-4 py-2.5 text-sm">
      <img src="/apple-touch-icon.png" alt="" className="size-8 shrink-0 rounded-lg" />
      <p className="min-w-0 flex-1 leading-snug">
        {isIos() ? (
          <>
            <Share className="inline size-4 -translate-y-0.5" /> 공유 → <b>홈 화면에 추가</b>하면 앱처럼 쓸 수 있어요
          </>
        ) : (
          '홈 화면에 추가하면 앱처럼 쓸 수 있어요'
        )}
      </p>
      {!isIos() && (
        <button
          type="button"
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          onClick={async () => {
            await deferred?.prompt()
            deferred = null
            dismiss()
          }}
        >
          설치
        </button>
      )}
      <button type="button" aria-label="안내 닫기" className="-mr-1 shrink-0 p-1 text-muted-foreground" onClick={dismiss}>
        <X className="size-4" />
      </button>
    </div>
  )
}
