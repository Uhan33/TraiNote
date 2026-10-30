import { BellRing, ChartLine, ClipboardList, EyeOff, History, KeyRound, ListPlus, MessageSquare, NotebookPen, Scale, Send, Smartphone, Ticket, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'

// 랜딩(/) — 로그인 확인 요청 없이 정적 화면. 로그인 상태면 /login 이 /workouts 로 보냄
// 빌드 때 HTML 로 미리 그려 landing.html 로 저장 (검색 노출 — vite.config 의 landingHtml). 브라우저 API·요청 쓰지 말 것
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
            <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">베타 · 모든 기능 무료</span>
            <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight md:text-5xl">
              회원 운동일지,
              <br />
              카톡 말고 한 곳에.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              수업 중에 바로 기록하고 <b className="font-semibold text-foreground">작성 완료</b>를 누르면 회원 폰으로 알림이 가요. 회원은 가입 없이
              코드 하나로 운동일지와 성장 그래프를 보고, PT 없는 날 혼자 한 운동도 남겨요.
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
          <TrainerPreview />
        </section>

        {/* 트레이너 */}
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
            <p className="text-sm font-semibold text-muted-foreground">트레이너</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">기록은 수업 중에, 빠르게</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Feature icon={<History />} title="자동 저장 · 지난 기록 불러오기">
                종목·무게·횟수를 입력하면 바로 저장돼요. 지난 수업을 그대로 불러와 무게만 바꿔 쓰면 끝. 인터넷이 끊겨도 폰에 보관했다가 다시 저장해요.
              </Feature>
              <Feature icon={<BellRing />} title="작성 완료하면 회원에게 알림">
                다 쓰고 작성 완료를 누르면 회원 폰으로 "운동일지가 도착했어요" 알림이 가요. 쓰는 중인 일지는 회원에게 안 보여요.
              </Feature>
              <Feature icon={<Ticket />} title="남은 PT 횟수 자동 차감">
                일지를 쓴 날마다 1회씩 줄어요. 3회 이하로 남으면 목록에 바로 보여 재등록 시점을 놓치지 않아요.
              </Feature>
              <Feature icon={<EyeOff />} title="놓친 일지 알려 주기">
                작성 완료를 깜빡한 일지는 목록 맨 위에 모아 보여 줘요. 눌러서 바로 마무리할 수 있어요.
              </Feature>
              <Feature icon={<NotebookPen />} title="회원 개인운동 확인 · 댓글 피드백">
                회원이 혼자 운동한 기록이 올라오면 따로 표시돼요. 열어 보고 댓글로 바로 피드백해요.
              </Feature>
              <Feature icon={<ListPlus />} title="내가 쓰는 종목 바로 찾기">
                목록에 없어 직접 입력한 종목은 운동 추가 창 맨 위에 모아 보여 줘요. kg·lb 단위도 종목별로 기억해요.
              </Feature>
            </div>
          </div>
        </section>

        {/* 회원 */}
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-20">
          <GrowthPreview />
          <div className="md:order-first">
            <p className="text-sm font-semibold text-muted-foreground">회원</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">회원은 변화를 눈으로 봐요</h2>
            <ul className="mt-8 flex flex-col gap-5">
              <Point icon={<ChartLine />} title="운동별 성장 그래프">
                가슴·등·하체 부위별로 종목을 골라 최고 무게가 어떻게 늘었는지 봐요.
              </Point>
              <Point icon={<Scale />} title="체중·체성분 그래프">
                체중·체지방률·골격근량 변화를 시작·현재와 함께 보여 줘요.
              </Point>
              <Point icon={<MessageSquare />} title="운동일지와 트레이너 코멘트">
                그날 한 운동과 세트, 트레이너가 남긴 한마디를 언제든 다시 봐요.
              </Point>
              <Point icon={<NotebookPen />} title="혼자 운동한 날도 기록">
                PT 없는 날 한 운동과 컨디션을 남기면 트레이너가 보고 댓글로 피드백해 줘요.
              </Point>
              <Point icon={<KeyRound />} title="가입 없이 코드 하나로">
                회원은 트레이너가 보낸 6자리 코드만 입력하면 끝. 따로 가입하거나 비밀번호를 만들 필요가 없어요.
              </Point>
            </ul>
          </div>
        </section>

        {/* 개인운동 */}
        <section className="border-t bg-muted/40">
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-20">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">개인운동</p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">PT 없는 날도 함께</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                회원이 혼자 운동한 종목과 느낀 점을 직접 기록해요. 트레이너는 새로 올라온 기록을 한눈에 보고, 댓글로 자세나 다음 운동을 바로 알려 줘요.
                수업 사이의 운동까지 이어서 관리할 수 있어요.
              </p>
            </div>
            <PersonalPreview />
          </div>
        </section>

        {/* 사용 방법 */}
        <section className="border-t">
          <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
            <h2 className="text-2xl font-bold md:text-3xl">시작은 1분이면 충분해요</h2>
            <ol className="mt-8 grid gap-3 md:grid-cols-3">
              <Step n={1} icon={<UserPlus />} title="회원 추가">
                이름과 남은 PT 횟수만 입력해요.
              </Step>
              <Step n={2} icon={<Send />} title="초대 보내기">
                카톡으로 주소와 회원 코드를 보내요.
              </Step>
              <Step n={3} icon={<ClipboardList />} title="수업마다 기록">
                작성 완료를 누르면 회원에게 알림이 가요.
              </Step>
            </ol>
          </div>
        </section>

        {/* 자주 묻는 질문 — 검색 노출에도 도움 */}
        <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <h2 className="text-2xl font-bold md:text-3xl">자주 묻는 질문</h2>
          <div className="mt-8 divide-y rounded-2xl border">
            <Faq q="정말 무료인가요?">베타 기간에는 회원 수 제한 없이 모든 기능을 무료로 쓸 수 있어요.</Faq>
            <Faq q="회원도 앱을 설치하거나 가입해야 하나요?">
              아니요. 트레이너가 보낸 링크를 열고 6자리 코드만 입력하면 돼요. 홈 화면에 추가하면 앱처럼 열리고 알림도 받을 수 있어요.
            </Faq>
            <Faq q="아이폰에서도 알림을 받을 수 있나요?">
              iOS 16.4 이상에서 사파리로 열어 홈 화면에 추가하면 받을 수 있어요. 안드로이드는 크롬·삼성 인터넷에서 홈 화면에 추가하면 돼요.
            </Faq>
            <Faq q="회원 개인정보는 무엇을 받나요?">
              회원 가입이 없어 연락처 같은 정보는 받지 않아요. 트레이너가 입력한 이름·운동일지·체중·체성분 기록과 회원이 직접 남긴 개인운동 기록·댓글만
              저장하고, 트레이너 메모는 트레이너에게만 보여요. 자세한 내용은{' '}
              <Link to="/privacy" className="underline underline-offset-2">
                개인정보처리방침
              </Link>
              에 있어요.
            </Faq>
            <Faq q="회원이 혼자 운동한 것도 기록할 수 있나요?">
              네. 회원 화면의 개인운동 탭에서 종목과 내용을 남길 수 있어요. 담당 트레이너만 볼 수 있고, 댓글로 서로 이야기할 수 있어요. 개인운동은 남은 PT
              횟수에서 빠지지 않아요.
            </Faq>
            <Faq q="PC나 태블릿에서도 쓸 수 있나요?">네. 브라우저로 열면 돼요. 태블릿·PC에서는 회원 목록과 일지를 나란히 보여 줘요.</Faq>
          </div>
        </section>

        {/* 마지막 안내 */}
        <section className="mx-auto max-w-5xl px-5 pb-20">
          <div className="rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground md:py-16">
            <Smartphone className="mx-auto size-8 text-primary-foreground/70" />
            <h2 className="mt-4 text-2xl font-bold md:text-3xl">베타 기간 동안 모든 기능 무료</h2>
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
          <span>© TraiNote 트레이노트 · PT 회원 운동일지</span>
          <span className="flex gap-4">
            <Link to="/privacy" className="font-semibold text-foreground">
              개인정보처리방침
            </Link>
            <span>v{__APP_VERSION__}</span>
          </span>
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

function Point({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted [&_svg]:size-5">{icon}</span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  )
}

function Step({ n, icon, title, children }: { n: number; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4 rounded-2xl border bg-background p-5">
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

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
        {q}
        <span className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </details>
  )
}

// 실제 회원 목록 화면을 본뜬 미리보기 (정적 예시 데이터) + 회원 폰에 간 알림
const PREVIEW = [
  { name: '김민지', summary: '하체 · 4개 운동 · 16세트', pt: 18, done: true },
  { name: '박서준', summary: '등 · 5개 운동 · 18세트', pt: 2, done: true },
  { name: '이하늘', summary: '가슴 · 3개 운동 · 12세트', pt: 25, done: false },
]

function TrainerPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm pt-10">
      <div className="absolute inset-x-4 top-0 z-10 flex items-center gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">T</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold">김민지님, 운동일지가 도착했어요</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">지금</span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">10월 22일 운동 기록을 확인해 보세요</span>
        </span>
      </div>
      <div className="rounded-[2rem] border bg-background p-4 pt-10 shadow-xl">
        <div className="flex items-center justify-between px-1">
          <span className="text-lg font-bold">운동일지</span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">+ 회원 추가</span>
        </div>
        <p className="px-1 pt-4 text-center text-sm font-semibold">10월 22일 (목) · 오늘</p>
        <p className="px-1 pt-4 pb-1 text-xs text-muted-foreground">회원 3명 · 작성 3</p>
        <ul>
          {PREVIEW.map((m) => (
            <li key={m.name} className="flex items-center gap-3 rounded-xl px-1 py-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{m.name[0]}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{m.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {!m.done && <span className="font-medium text-amber-700 dark:text-amber-400">완료 전 · </span>}
                  {m.summary}
                </span>
              </span>
              <span className={`shrink-0 text-xs ${m.pt <= 3 ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>{m.pt}회 남음</span>
              <span className={`size-1.5 shrink-0 rounded-full ${m.done ? 'bg-foreground' : 'border border-foreground'}`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// 회원 성장 화면 미리보기 — 스쿼트 최고 중량 (정적 예시)
const SQUAT = [40, 42.5, 45, 45, 47.5, 50, 52.5, 52.5, 55, 57.5, 60]

function GrowthPreview() {
  const min = 35
  const max = 65
  const points = SQUAT.map((v, i) => `${(i / (SQUAT.length - 1)) * 100},${((max - v) / (max - min)) * 100}`).join(' ')
  return (
    <div aria-hidden className="mx-auto w-full max-w-sm rounded-[2rem] border bg-background p-4 shadow-xl">
      <span className="block px-1 pt-1 text-lg font-bold">성장</span>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-center text-xs">
        <span className="rounded-lg bg-background py-1.5 font-semibold shadow-sm">운동</span>
        <span className="py-1.5 text-muted-foreground">체중</span>
      </div>
      <div className="mt-3 flex gap-3 border-b px-1 text-xs">
        <span className="pb-2 text-muted-foreground">가슴</span>
        <span className="pb-2 text-muted-foreground">등</span>
        <span className="-mb-px border-b-2 border-foreground pb-2 font-semibold">하체</span>
        <span className="pb-2 text-muted-foreground">어깨</span>
      </div>
      <div className="mt-3 flex gap-1.5 text-xs">
        <span className="rounded-full bg-foreground px-3 py-1.5 text-background">스쿼트</span>
        <span className="rounded-full border px-3 py-1.5 text-muted-foreground">레그 프레스</span>
        <span className="rounded-full border px-3 py-1.5 text-muted-foreground">런지</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        {[
          ['시작', '40kg'],
          ['현재', '60kg'],
          ['변화', '+20kg'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted py-2">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-sm font-bold">{value}</p>
          </div>
        ))}
      </div>
      <svg viewBox="-4 -8 108 116" preserveAspectRatio="none" className="mt-3 h-36 w-full text-foreground">
        {[0, 50, 100].map((y) => (
          <line key={y} x1={0} x2={100} y1={y} y2={y} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="pt-1 text-center text-[11px] text-muted-foreground">날짜별 최고 중량</p>
    </div>
  )
}

// 개인운동 미리보기 — 회원 기록 + 트레이너 댓글 (정적 예시)
function PersonalPreview() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-sm rounded-[2rem] border bg-background p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="font-semibold">10월 30일 (금)</span>
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">새 기록</span>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 rounded-xl bg-muted p-3 text-xs">
        <li className="flex justify-between">
          <span className="font-medium">스쿼트</span>
          <span className="text-muted-foreground">40kg × 12회 · 3세트</span>
        </li>
        <li className="flex justify-between">
          <span className="font-medium">불가리안 스플릿 스쿼트</span>
        </li>
        <li className="flex justify-between">
          <span className="font-medium">레그 프레스</span>
          <span className="text-muted-foreground">80kg × 15회 · 2세트</span>
        </li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed">배운 대로 하체 혼자 해봤어요! 불가리안은 왼쪽이 더 힘드네요.</p>
      <div className="mt-4 border-t pt-3 text-sm">
        <p>
          <span className="font-semibold">트레이너</span> <span className="text-xs text-muted-foreground">방금</span>
        </p>
        <p className="mt-0.5">잘하셨어요! 불가리안은 왼쪽 먼저 하고 오른쪽 맞춰 주세요 👍</p>
      </div>
    </div>
  )
}
