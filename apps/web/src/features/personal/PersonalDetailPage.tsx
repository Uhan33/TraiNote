import { ChevronLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { personalWorkoutsAddComment, personalWorkoutsList, personalWorkoutsMarkRead, personalWorkoutsRemoveComment, useMembersList } from '@/api/generated'
import PersonalFeed from './PersonalFeed'

// 트레이너 — 회원 개인운동 보기·피드백 댓글 (작성은 회원만)
export default function PersonalDetailPage() {
  const { memberId: code = '' } = useParams()
  const navigate = useNavigate()
  const members = useMembersList()
  const member = members.data?.find((m) => m.code === code.toUpperCase())

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 max-w-2xl items-center gap-1 px-2 lg:px-6">
          <Button variant="ghost" size="icon-lg" aria-label="회원 목록" className="md:hidden" onClick={() => navigate('/personal')}>
            <ChevronLeft className="size-6" />
          </Button>
          <span className="text-lg font-semibold">{member?.name}</span>
        </div>
      </header>
      {members.isSuccess && !member && <p className="py-16 text-center text-muted-foreground">회원을 찾을 수 없어요</p>}
      {member && (
        <div className="w-full max-w-2xl px-5 pt-5 pb-10 lg:px-8">
          <PersonalFeed
            key={member.code}
            queryKey={`/api/v1/members/${member.code}/personal-workouts`}
            fetchPage={(before) => personalWorkoutsList(member.code, before ? { before } : undefined)}
            viewer="trainer"
            memberName={member.name}
            addComment={(date, content) => personalWorkoutsAddComment(member.code, date, { content })}
            removeComment={(date, id) => personalWorkoutsRemoveComment(member.code, date, id)}
            markRead={(date) => personalWorkoutsMarkRead(member.code, date)}
            empty={
              <p className="py-16 text-center text-muted-foreground">
                아직 기록한 개인운동이 없어요
                <br />
                <span className="text-sm">회원 화면의 개인운동 탭에서 직접 기록할 수 있어요</span>
              </p>
            }
          />
        </div>
      )}
    </div>
  )
}
