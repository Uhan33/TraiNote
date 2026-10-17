import { ChartLine, ClipboardList, KeyRound, Send, Ticket, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'

// 랜딩(/) — 로그인 확인 요청 없이 정적 화면. 로그인 상태면 /login 이 /workouts 로 보냄
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <span className="text-lg font-bold">TraiNote</span>
        <nav className="flex items-center gap-1">
          <Link to="/member" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            회원 입장
          </Link>
          <Link to="/login" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
            로그인
          </Link>
        </nav>
      </header>

      <main>
        {/* 첫 화면 */}
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 pt-10 pb-16 md:grid-cols-2 md:pt-20 md:pb-24">
          <div>
            <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">베타 · 무료</span>
            <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight md:text-5xl">
              회원 운동일지,
              <br />
              카톡 말고 한 곳에.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              트레이너는 수업 중에 바로 기록하고,
              <br />
              회원은 가입 없이 코드 하나로 자기 기록을 봐요.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link to="/signup" className={buttonVariants({ size: 'lg', className: 'h-12 rounded-xl px-6 text-base' })}>
                무료로 시작하기
              </Link>
              <Link to="/member" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-12 rounded-xl px-6 text-base' })}>
                회원 코드로 입장
              </Link>
            </div>
          </div>
          <AppPreview />
        </section>

        {/* 기능 */}
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
            <h2 className="text-2xl font-bold md:text-3xl">수업에 필요한 기록만 담았어요</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Feature icon={<ClipboardList />} title="운동일지 자동 저장">
                종목·무게·횟수를 입력하면 바로 저장돼요. 지난 수업 기록을 불러와 그대로 이어 쓸 수 있어요.
              </Feature>
              <Feature icon={<Ticket />} title="남은 PT 횟수 자동 차감">
                일지를 쓴 날마다 1회씩 줄어요. 3회 이하로 남으면 목록에서 바로 보여 재등록 시점을 놓치지 않아요.
              </Feature>
              <Feature icon={<ChartLine />} title="체중·체성분 그래프">
                체중·체지방률·골격근량을 기록하면 변화가 그래프로 보여요. 회원도 같은 그래프를 봐요.
              </Feature>
              <Feature icon={<KeyRound />} title="회원은 가입 없이">
                회원은 6자리 코드만 입력하면 끝. 이름 외 개인정보는 받지 않아요.
              </Feature>
            </div>
          </div>
        </section>

        {/* 사용 방법 */}
        <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
          <h2 className="text-2xl font-bold md:text-3xl">시작은 1분이면 충분해요</h2>
          <ol className="mt-8 grid gap-3 md:grid-cols-3">
            <Step n={1} icon={<UserPlus />} title="회원 추가">
              이름과 남은 PT 횟수만 입력해요.
            </Step>
            <Step n={2} icon={<Send />} title="초대 보내기">
              카톡으로 주소와 회원 코드를 보내요.
            </Step>
            <Step n={3} icon={<ClipboardList />} title="수업마다 기록">
              회원은 기록이 쌓이는 걸 언제든 확인해요.
            </Step>
          </ol>
        </section>

        {/* 마지막 안내 */}
        <section className="mx-auto max-w-5xl px-5 pb-20">
          <div className="rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground md:py-16">
            <h2 className="text-2xl font-bold md:text-3xl">베타 기간 동안 모든 기능 무료</h2>
            <p className="mt-3 text-primary-foreground/70">아이디·비밀번호만으로 바로 시작할 수 있어요.</p>
            <Link
              to="/signup"
              className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'mt-8 h-12 rounded-xl px-8 text-base' })}
            >
              무료로 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-muted-foreground">
          <span>© TraiNote</span>
          <span>v{__APP_VERSION__}</span>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-background p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-muted [&_svg]:size-5">{icon}</span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

function Step({ n, icon, title, children }: { n: number; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4 rounded-2xl border p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{n}</span>
      <div>
        <h3 className="flex items-center gap-2 font-semibold [&_svg]:size-4 [&_svg]:text-muted-foreground">
          {title} {icon}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  )
}

// 실제 회원 목록 화면을 본뜬 미리보기 (정적 예시 데이터)
const PREVIEW = [
  { name: '김민지', summary: '하체 · 4개 운동 · 16세트', pt: 18, done: true },
  { name: '박서준', summary: '등 · 5개 운동 · 18세트', pt: 2, done: true },
  { name: '이영희', summary: '작성 전', pt: 25, done: false },
]

function AppPreview() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-sm rounded-[2rem] border bg-background p-4 shadow-xl">
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-lg font-bold">운동일지</span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">+ 회원 추가</span>
      </div>
      <p className="px-1 pt-4 text-center text-sm font-semibold">10월 17일 (토) · 오늘</p>
      <p className="px-1 pt-4 pb-1 text-xs text-muted-foreground">회원 3명 · 작성 2</p>
      <ul>
        {PREVIEW.map((m) => (
          <li key={m.name} className="flex items-center gap-3 rounded-xl px-1 py-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{m.name[0]}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{m.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{m.summary}</span>
            </span>
            <span className={`shrink-0 text-xs ${m.pt <= 3 ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>{m.pt}회 남음</span>
            {m.done && <span className="size-1.5 shrink-0 rounded-full bg-foreground" />}
          </li>
        ))}
      </ul>
    </div>
  )
}
