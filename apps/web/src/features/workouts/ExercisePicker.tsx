import { History, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import type { ExerciseCatalogDto } from '@/api/generated'
import { groupExercises } from './data'

const CUSTOM = '직접 입력'
const CUSTOM_PREVIEW = 5

// 운동 추가 창 — 트레이너 일지·회원 개인운동 공용. 목록은 쓰는 쪽에서 받아서 넘김
// catalog: 기본 종목 / custom: 직접 입력했던 종목(최근 쓴 순) — 기본 목록보다 위에
export default function ExercisePicker({
  open,
  onOpenChange,
  onPick,
  catalog,
  custom,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (name: string) => void
  catalog?: ExerciseCatalogDto[]
  custom?: string[]
}) {
  const [query, setQuery] = useState('')
  const [showAllCustom, setShowAllCustom] = useState(false)
  const q = query.trim()
  const groups = [[CUSTOM, custom ?? []] as [string, string[]], ...groupExercises(catalog ?? [])]
    .map(([part, names]) => [part, names.filter((n) => n.includes(q))] as const)
    .filter(([, names]) => names.length > 0)
  const exactMatch = groups.some(([, names]) => names.includes(q))
  // 직접 입력은 검색 전엔 최근 5개만 — 쌓여도 기본 목록이 밀려나지 않게
  const hiddenCustom = !q && !showAllCustom ? Math.max(0, (custom?.length ?? 0) - CUSTOM_PREVIEW) : 0

  return (
    <Drawer open={open} onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setQuery('')
          setShowAllCustom(false)
        }
      }}>
      <DrawerContent className="mx-auto h-[85dvh] max-w-md">
        <DrawerHeader>
          <DrawerTitle>운동 추가</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="운동 이름 검색" className="h-11 pl-9 text-base md:text-base" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {q && !exactMatch && (
            <button type="button" onClick={() => onPick(q)} className="flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left active:bg-muted">
              <Plus className="size-4" /> '{q}' 직접 추가
            </button>
          )}
          {groups.map(([part, names]) => (
            <div key={part} className="mt-3">
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{part}</p>
              {(part === CUSTOM && hiddenCustom ? names.slice(0, CUSTOM_PREVIEW) : names).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onPick(name)}
                  className="flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left text-base active:bg-muted"
                >
                  {part === CUSTOM && <History className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  {name}
                </button>
              ))}
              {part === CUSTOM && hiddenCustom > 0 && (
                <button type="button" onClick={() => setShowAllCustom(true)} className="px-2 py-1 text-xs text-muted-foreground underline-offset-2 active:underline">
                  이전 기록 더보기
                </button>
              )}
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
