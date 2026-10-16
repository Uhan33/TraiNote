import { ClipboardCheck, Dumbbell, Scale, UserRound, Utensils, type LucideIcon } from 'lucide-react'

export type Tab = { to: string; label: string; icon: LucideIcon }

// 트레이너·회원 공통 메뉴. base: '' (트레이너) | '/member' (회원)
export const appTabs = (base: string): Tab[] => [
  { to: `${base}/workouts`, label: '운동일지', icon: Dumbbell },
  { to: `${base}/homework`, label: '숙제', icon: ClipboardCheck },
  { to: `${base}/meals`, label: '식단', icon: Utensils },
  { to: `${base}/body`, label: '체중', icon: Scale },
  { to: `${base}/settings`, label: '내 정보', icon: UserRound },
]
