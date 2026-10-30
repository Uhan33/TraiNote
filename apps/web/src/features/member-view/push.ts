import { memberViewSubscribePush } from '@/api/generated'
import type { PushAudience } from '@/lib/push'

// 회원 알림: 트레이너가 운동일지를 작성 완료하거나 개인운동에 댓글을 남기면
export const MEMBER_PUSH: PushAudience = {
  askedKey: 'pushConsentAsked',
  register: (device, welcome) => memberViewSubscribePush({ ...device, welcome }),
}

export const MEMBER_PUSH_DESCRIPTION = '트레이너가 운동일지를 작성하거나 댓글을 남기면 알려드려요'
