import type { GrowthView } from '@/lib/body'

// 성장 화면 운동·체중 전환 (트레이너·회원 공용)
export default function GrowthToggle({ value, onChange }: { value: GrowthView; onChange: (v: GrowthView) => void }) {
  return (
    <div role="tablist" aria-label="보기" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      {(
        [
          ['strength', '운동'],
          ['body', '체중'],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={`h-10 rounded-lg text-sm transition-colors ${value === key ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
