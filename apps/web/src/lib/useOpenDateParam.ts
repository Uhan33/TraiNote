import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

// 알림으로 ?date=YYYY-MM-DD 를 받아 열면 목록을 불러온 뒤 그 날짜 창을 바로 열고 주소에서 지움
// 불러온 목록(최근 10개)에 없으면 목록만 보여 줌
export function useOpenDateParam(dates: string[] | undefined, open: (date: string) => void) {
  const [params, setParams] = useSearchParams()
  const date = params.get('date')
  useEffect(() => {
    if (!date || !dates) return
    if (dates.includes(date)) open(date)
    setParams((p) => (p.delete('date'), p), { replace: true })
  }, [date, dates, open, setParams])
}
