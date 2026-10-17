import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { ko } from 'react-day-picker/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { formatDateLabel, fromDateKey, shiftDateKey, toDateKey, todayKey } from './data'

const START_MONTH = new Date(2020, 0)
const END_MONTH = new Date(new Date().getFullYear() + 1, 11) // 내년 12월까지

// ‹ 날짜 › — 화살표로 하루씩, 날짜를 누르면 달력(markedDates 에 점 표시)
export default function DateNav({
  value,
  onChange,
  markedDates,
}: {
  value: string
  onChange: (key: string) => void
  markedDates: string[]
}) {
  const [open, setOpen] = useState(false)
  const isToday = value === todayKey()

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon-lg" aria-label="이전 날" onClick={() => onChange(shiftDateKey(value, -1))}>
        <ChevronLeft className="size-5" />
      </Button>
      <button type="button" onClick={() => setOpen(true)} className="flex h-10 items-center gap-1 rounded-lg px-3 font-semibold active:bg-muted">
        {formatDateLabel(value)}
        {isToday && <span className="text-sm font-medium text-muted-foreground">· 오늘</span>}
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
      <Button variant="ghost" size="icon-lg" aria-label="다음 날" onClick={() => onChange(shiftDateKey(value, 1))}>
        <ChevronRight className="size-5" />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader className="flex-row items-center justify-between">
            <DrawerTitle>날짜 선택</DrawerTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onChange(todayKey())
                setOpen(false)
              }}
            >
              오늘
            </Button>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <Calendar
              mode="single"
              locale={ko}
              selected={fromDateKey(value)}
              defaultMonth={fromDateKey(value)}
              // 연·월 드롭다운으로 한 번에 이동, 항상 6주 표시해 높이 고정
              captionLayout="dropdown"
              startMonth={START_MONTH}
              endMonth={END_MONTH}
              fixedWeeks
              onSelect={(d) => {
                if (d) onChange(toDateKey(d))
                setOpen(false)
              }}
              modifiers={{ marked: markedDates.map(fromDateKey) }}
              modifiersClassNames={{
                marked:
                  'relative after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-foreground/60',
              }}
              className="w-full bg-transparent p-0 [--cell-size:--spacing(11)]"
              classNames={{ root: 'w-full' }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
