import type { CreateInquiryDtoCategory } from '@/api/generated'

export const INQUIRY_CATEGORIES: { value: CreateInquiryDtoCategory; label: string }[] = [
  { value: 'usage', label: '사용 방법' },
  { value: 'bug', label: '오류 신고' },
  { value: 'feature', label: '기능 제안' },
  { value: 'etc', label: '기타' },
]

export const categoryLabel = (value: string) => INQUIRY_CATEGORIES.find((c) => c.value === value)?.label ?? '기타'
