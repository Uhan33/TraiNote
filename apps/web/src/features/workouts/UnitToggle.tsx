import { rememberUnit, type Unit } from './data'

// 무게 단위 — 눌러서 kg ⇄ lb (기구가 파운드 표기일 때). 종목별로 이 기기에 기억. 트레이너 일지·회원 개인운동 공용
export default function UnitToggle({ name, unit, onChange }: { name: string; unit: Unit; onChange: (unit: Unit) => void }) {
  return (
    <button
      type="button"
      aria-label={`무게 단위 ${unit}, 눌러서 ${unit === 'kg' ? 'lb' : 'kg'}로 바꾸기`}
      onClick={() => {
        const next = unit === 'kg' ? 'lb' : 'kg'
        rememberUnit(name, next)
        onChange(next)
      }}
      className="mx-auto flex h-6 items-center rounded-full bg-muted p-0.5 text-xs"
    >
      {(['kg', 'lb'] as const).map((u) => (
        <span key={u} className={`rounded-full px-2 py-0.5 ${unit === u ? 'bg-background font-semibold text-foreground shadow-sm' : 'text-muted-foreground'}`}>
          {u}
        </span>
      ))}
    </button>
  )
}
