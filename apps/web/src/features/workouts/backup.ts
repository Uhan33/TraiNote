import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ApiError } from '@/api/fetcher'
import { workoutsSave } from '@/api/generated'
import { toApi, type WorkoutForm } from './data'

// 서버에 아직 저장 못 한 일지를 이 기기(localStorage)에 보관 — 헬스장 와이파이가 끊겨도 안 사라지게
// 편집 중 입력마다 덮어쓰고, 저장되면 지움. 남아 있으면 다시 열 때 복원하고, 앱 시작·연결 복구 때 대신 저장
const PREFIX = 'trainote.unsaved:'

export const backupKey = (code: string, date: string) => `${PREFIX}${code}:${date}`

// 편집기가 열려 있는 일지 — 편집기가 직접 저장하므로 일괄 저장에서 건너뜀 (옛 값이 늦게 도착해 덮어쓰지 않게)
export const editing = new Set<string>()

export function readBackup(key: string): WorkoutForm | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as WorkoutForm) : null
  } catch {
    return null
  }
}

export function writeBackup(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간이 없거나 막힌 브라우저 — 보관 없이 서버 저장만
  }
}

// 저장한 값과 같을 때만 지움 — 그 사이 새로 입력한 내용은 남김
export function clearBackup(key: string, saved: unknown) {
  try {
    if (localStorage.getItem(key) === JSON.stringify(saved)) localStorage.removeItem(key)
  } catch {
    // 무시
  }
}

// 남은 보관본을 서버에 저장 (트레이너 화면 열 때·인터넷 연결 복구 때·30초마다 — 서버만 잠깐 안 될 때도 있어서)
export function useUnsavedSync() {
  const queryClient = useQueryClient()
  useEffect(() => {
    let running = false
    const sync = async () => {
      if (running) return
      running = true
      let synced = 0
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX) && !editing.has(k))
        for (const key of keys) {
          const form = readBackup(key)
          const [code, date] = key.slice(PREFIX.length).split(':')
          if (!form || !code || !date) continue
          try {
            await workoutsSave(code, date, toApi(form))
            synced++
          } catch (e) {
            // 삭제된 회원 등 서버가 거절한 일지는 버림. 그 외(연결 끊김)는 다음 연결 복구 때 다시
            if (!(e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 429)) break
          }
          clearBackup(key, form)
        }
      } catch {
        // localStorage 를 못 쓰는 브라우저 — 보관본 없음
      } finally {
        running = false
      }
      if (synced) await queryClient.invalidateQueries()
    }
    void sync()
    const timer = window.setInterval(sync, 30_000)
    window.addEventListener('online', sync)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('online', sync)
    }
  }, [queryClient])
}
