import { useState } from 'react'
import type { MemberDto } from '@/api/generated'

// 회원 초대 보내기 — 폰(터치 기기)은 공유 창으로 카톡·문자 바로 선택, 그 외는 클립보드 복사
// 주소에 코드를 넣지 않고 회원이 따로 입력하게 함
export function useInvite(member: Pick<MemberDto, 'name' | 'code'> | null) {
  const [copied, setCopied] = useState(false)

  const send = async () => {
    if (!member) return
    const text = `[TraiNote] ${member.name}님 운동일지\n${window.location.origin}/member\n회원 코드: ${member.code}`
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      // 사용자가 공유 창을 닫으면 AbortError — 무시
      await navigator.share({ text }).catch(() => {})
      return
    }
    // 공유·클립보드 모두 https(또는 localhost)에서만 동작 — 폰에서 http://<맥 IP> 로 테스트하면 아무 일도 없음
    if (!(await navigator.clipboard?.writeText(text).then(() => true, () => false))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return { send, copied }
}
