import { Dumbbell, TrendingUp, UserRound, type LucideIcon } from 'lucide-react'

export type Tab = { to: string; label: string; icon: LucideIcon }

// 트레이너·회원 공통 메뉴. base: '' (트레이너) | '/member' (회원)
// 숙제(/homework, ClipboardCheck)·식단(/meals, Utensils)은 준비 중이라 메뉴에서만 숨김 — 화면·주소는 그대로.
// 다시 보이려면 성장 다음에 두 줄 추가
export const appTabs = (base: string): Tab[] => [
  { to: `${base}/workouts`, label: '운동일지', icon: Dumbbell },
  { to: `${base}/body`, label: '성장', icon: TrendingUp }, // 운동(최고 중량)·체중 그래프
  { to: `${base}/settings`, label: '내 정보', icon: UserRound },
]
