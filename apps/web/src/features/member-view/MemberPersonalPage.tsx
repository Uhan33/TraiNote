import { NotebookPen } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { memberViewAddPersonalWorkoutComment, memberViewPersonalWorkouts, memberViewRemovePersonalWorkoutComment } from '@/api/generated'
import PersonalFeed from '@/features/personal/PersonalFeed'
import { useMemberProfile } from './useMemberProfile'

export const PERSONAL_KEY = '/api/v1/member/me/personal-workouts'

// 회원 개인운동 (/member/personal) — 직접 기록하고 트레이너와 댓글
export default function MemberPersonalPage() {
  const profile = useMemberProfile()
  const navigate = useNavigate()

  return (
    <div className="flex-1 md:overflow-y-auto">
      <div className="mx-auto w-full max-w-xl px-5 pt-6 pb-12">
        <header>
          <h1 className="text-2xl font-bold">개인운동</h1>
          <p className="mt-1 text-sm text-muted-foreground">혼자 운동한 내용을 남기면 트레이너가 보고 피드백해 드려요</p>
        </header>

        <Button className="mt-5 h-12 w-full rounded-xl text-base" onClick={() => navigate('/member/personal/write')}>
          <NotebookPen /> 운동 기록하기
        </Button>

        <div className="mt-6">
          <PersonalFeed
            queryKey={PERSONAL_KEY}
            fetchPage={(before) => memberViewPersonalWorkouts(before ? { before } : undefined)}
            viewer="member"
            memberName={profile.data?.name ?? '나'}
            addComment={(date, content) => memberViewAddPersonalWorkoutComment(date, { content })}
            removeComment={(date, id) => memberViewRemovePersonalWorkoutComment(date, id)}
            onEdit={(date) => navigate(`/member/personal/write?date=${date}`)}
            empty={<p className="py-16 text-center text-muted-foreground">아직 기록한 개인운동이 없어요</p>}
          />
        </div>
      </div>
    </div>
  )
}
