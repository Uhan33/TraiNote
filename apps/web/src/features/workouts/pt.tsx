import { Input } from '@/components/ui/input'

// 숫자 입력 + 재등록 빠른 추가(+10/+20/+30). 빈 값 = 횟수 관리 안 함
export function PtInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const add = (n: number) => onChange(String(Math.min(999, Math.max(0, Number(value || 0)) + n)))
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="예: 30"
          className="h-12 pr-10 text-base md:text-base"
        />
        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">회</span>
      </div>
      <div className="flex gap-2">
        {[10, 20, 30].map((n) => (
          <button key={n} type="button" onClick={() => add(n)} className="h-9 flex-1 rounded-lg bg-muted text-sm font-medium active:bg-muted/60">
            +{n}
          </button>
        ))}
      </div>
    </div>
  )
}
