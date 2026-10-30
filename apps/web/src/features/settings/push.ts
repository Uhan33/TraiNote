import { pushSubscribe } from '@/api/generated'
import type { PushAudience } from '@/lib/push'

// 트레이너 알림: 회원 개인운동·댓글, 문의 답변·TraiNote 소식 (운영자는 새 문의까지)
export const TRAINER_PUSH: PushAudience = {
  askedKey: 'trainerPushConsentAsked',
  register: (device, welcome) => pushSubscribe({ ...device, welcome }),
}

export const TRAINER_PUSH_DESCRIPTION = '회원 개인운동·댓글, 문의 답변과 TraiNote 새 소식을 알려드려요'
