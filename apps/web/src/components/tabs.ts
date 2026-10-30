import { Dumbbell, NotebookPen, TrendingUp, UserRound, type LucideIcon } from 'lucide-react'

// badge: 아이콘에 빨간 점 (안 읽은 것 있음)
export type Tab = { to: string; label: string; icon: LucideIcon; badge?: boolean }

// 트레이너·회원 공통 메뉴. base: '' (트레이너) | '/member' (회원)
// 숙제(/homework, ClipboardCheck)·식단(/meals, Utensils)은 준비 중이라 메뉴에서만 숨김 — 화면·주소는 그대로.
// 다시 보이려면 성장 다음에 두 줄 추가 (숙제는 트레이너→회원, 개인운동은 회원→트레이너)
export const appTabs = (base: string): Tab[] => [
  { to: `${base}/workouts`, label: '운동일지', icon: Dumbbell },
  { to: `${base}/personal`, label: '개인운동', icon: NotebookPen }, // 회원이 기록, 트레이너는 댓글
  { to: `${base}/body`, label: '성장', icon: TrendingUp }, // 운동(최고 중량)·체중 그래프
  { to: `${base}/settings`, label: '내 정보', icon: UserRound },
]
