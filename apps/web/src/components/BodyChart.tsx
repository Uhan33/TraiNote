import { useEffect, useRef, useState } from 'react'
import type { MetricPoint } from '@/lib/body'

const HEIGHT = 200
const PAD = { top: 20, right: 20, bottom: 26, left: 36 }
const DAY = 24 * 60 * 60 * 1000

const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`)
const shortDate = (date: string) => `${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}`

// 체성분 추이 선 그래프 (항목 하나씩 — 단위가 달라 한 그래프에 겹치지 않음) (단일 계열 · 2px 선 · 연한 보조선 · 가까운 날짜에 맞춘 세로선 + 값 표시)
// 라이브러리 없이 SVG. 색은 글자색 토큰(currentColor)만 사용 → 다크 모드 자동
export default function BodyChart({ points: data, unit, label }: { points: MetricPoint[]; unit: string; label: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)

  // 실제 폭으로 그려 글자 크기가 화면 폭에 따라 늘어나지 않게
  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (data.length === 0) {
    return <p className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">아직 {label} 기록이 없어요</p>
  }

  const values = data.map((d) => d.value)
  // 세로축: 최소·최대에 여유 1(단위), 정수 눈금 3개
  const yMin = Math.floor(Math.min(...values) - 1)
  const yMaxRaw = Math.ceil(Math.max(...values) + 1)
  const yMax = (yMaxRaw - yMin) % 2 ? yMaxRaw + 1 : yMaxRaw // 가운데 눈금도 정수가 되게 간격을 짝수로
  const yTicks = [yMin, (yMin + yMax) / 2, yMax]
  // 가로축: 실제 날짜 간격 (기록이 하루면 ±1일로 폭 확보)
  const t0 = toTime(data[0].date)
  const t1 = Math.max(toTime(data.at(-1)!.date), t0 + DAY)

  const plotW = Math.max(width - PAD.left - PAD.right, 1)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (date: string) => PAD.left + ((toTime(date) - t0) / (t1 - t0)) * plotW
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH
  const points = data.map((d) => [x(d.date), y(d.value)] as const)
  const path = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join('')

  // 포인터에서 가장 가까운 날짜 (선이 아니라 날짜를 겨냥)
  const pick = (clientX: number) => {
    const left = box.current!.getBoundingClientRect().left
    let best = 0
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(points[i][0] - (clientX - left)) < Math.abs(points[best][0] - (clientX - left))) best = i
    }
    setActive(best)
  }

  const shown = active ?? data.length - 1
  const [ax, ay] = points[shown]
  const showDots = data.length <= 30
  // 값 표시가 위로 넘치면 점 아래에
  const tipBelow = ay < 56

  return (
    <div ref={box} className="relative text-foreground select-none">
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${label} 추이: ${shortDate(data[0].date)} ${data[0].value}${unit} 부터 ${shortDate(data.at(-1)!.date)} ${data.at(-1)!.value}${unit} 까지`}
          className="touch-pan-y"
          onPointerMove={(e) => pick(e.clientX)}
          onPointerDown={(e) => pick(e.clientX)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px]">
                {t}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={HEIGHT - 6} className="fill-muted-foreground text-[11px]">
            {shortDate(data[0].date)}
          </text>
          {data.length > 1 && (
            <text x={width - PAD.right} y={HEIGHT - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">
              {shortDate(data.at(-1)!.date)}
            </text>
          )}

          {active !== null && <line x1={ax} x2={ax} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-muted-foreground/50" strokeWidth={1} />}
          <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {showDots && points.map(([px, py], i) => <circle key={i} cx={px} cy={py} r={2.5} fill="currentColor" />)}
          <circle cx={ax} cy={ay} r={5} fill="currentColor" className="stroke-background" strokeWidth={2} />
        </svg>
      )}

      {/* 선택(기본: 최신) 지점 값 — 값이 먼저, 날짜는 보조 */}
      {width > 0 && (
        <div
          className={`pointer-events-none absolute -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-center shadow-sm ${tipBelow ? '' : '-translate-y-full'}`}
          style={{ left: Math.min(Math.max(ax, 44), width - 44), top: tipBelow ? ay + 10 : ay - 10 }}
        >
          <p className="text-sm leading-tight font-semibold">
            {data[shown].value}
            {unit}
          </p>
          <p className="text-[11px] leading-tight text-muted-foreground">{shortDate(data[shown].date)}</p>
        </div>
      )}
    </div>
  )
}
