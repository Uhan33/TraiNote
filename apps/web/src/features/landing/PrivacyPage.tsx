import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

// /privacy — 개인정보처리방침. 바꾸면 EFFECTIVE 날짜도 갱신
const EFFECTIVE = '2026년 10월 26일'
const CONTACT = 'typhoid33@naver.com'

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-4 pb-16 leading-relaxed">
      <Link to="/" className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> TraiNote
      </Link>
      <h1 className="mt-4 text-2xl font-bold">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted-foreground">시행일 {EFFECTIVE}</p>
      <p className="mt-6">
        TraiNote(이하 &lsquo;서비스&rsquo;)는 트레이너가 PT 회원의 운동일지와 체성분 기록을 관리하고 회원과 공유하는 서비스입니다. 서비스는
        「개인정보 보호법」에 따라 이용자의 개인정보를 다음과 같이 처리합니다.
      </p>

      <Section title="1. 처리하는 개인정보">
        <Table
          rows={[
            ['트레이너', '아이디, 비밀번호(암호화 저장), 이름, 이메일(선택)'],
            ['회원', '이름, 운동일지(종목·세트·코멘트), 체중·체지방률·골격근량, PT 남은 횟수 — 트레이너가 입력'],
            ['문의', '문의 내용, 연락처(선택), 앱 버전, 브라우저 정보'],
            ['알림', '알림을 켠 기기의 푸시 수신 주소'],
            ['자동 수집', '접속 IP, 접속 시각, 브라우저 정보(User-Agent), 로그인 유지용 쿠키'],
          ]}
        />
        <p>
          회원은 가입 없이 트레이너가 알려 준 회원 코드로 입장하며, 서비스가 회원에게 직접 받는 정보는 없습니다. 체중·체성분 기록은 트레이너가 수업을
          위해 회원의 동의를 받아 입력합니다. 트레이너가 회원에 대해 남긴 메모는 트레이너에게만 보입니다.
        </p>
      </Section>

      <Section title="2. 처리 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>트레이너 회원가입·로그인, 본인 확인</li>
          <li>운동일지·체성분 기록 작성과 회원 화면 공유, 성장 그래프 제공</li>
          <li>운동일지 작성 완료·문의 답변 알림 발송</li>
          <li>문의 응대, 오류 확인과 부정 이용(무단 접속 시도 등) 방지</li>
        </ul>
      </Section>

      <Section title="3. 보유 기간과 파기">
        <ul className="list-disc space-y-1 pl-5">
          <li>트레이너·회원 정보와 기록: 트레이너가 탈퇴를 요청할 때까지. 요청을 받으면 지체 없이 파기합니다.</li>
          <li>
            트레이너가 회원을 삭제하면 회원 화면 접속과 알림이 바로 끊깁니다. 기록은 실수로 삭제한 경우의 복구를 위해 보관하며, 트레이너나 회원이
            파기를 요청하면 지체 없이 파기합니다.
          </li>
          <li>접속 기록: 30일 후 자동 삭제</li>
          <li>데이터베이스 백업: 30일 후 자동 삭제</li>
        </ul>
        <p>전자 파일은 복구할 수 없는 방법으로 삭제합니다.</p>
      </Section>

      <Section title="4. 제3자 제공">
        <p>이용자의 개인정보를 제3자에게 제공하지 않습니다. 법령에 따라 요구되는 경우는 예외로 합니다.</p>
      </Section>

      <Section title="5. 처리 위탁·국외 이전">
        <Table
          rows={[
            ['Amazon Web Services', '서버 운영·데이터 보관·백업 (서울 리전)'],
            ['Apple·Google·Mozilla 등 브라우저 회사', '알림 전달 — 알림을 켠 기기로 알림 문구만 전송'],
          ]}
        />
        <p>알림은 이용자가 기기에서 알림을 켠 경우에만 각 브라우저 회사의 푸시 서버(국외)를 거쳐 전달됩니다.</p>
      </Section>

      <Section title="6. 이용자의 권리">
        <p>
          이용자는 언제든 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 트레이너는 앱에서 회원 정보와 기록을 직접 고치거나 삭제할 수
          있고, 회원은 담당 트레이너나 아래 연락처로 요청할 수 있습니다. 요청을 받으면 지체 없이 처리합니다.
        </p>
      </Section>

      <Section title="7. 쿠키">
        <p>
          로그인 상태를 유지하는 데에만 쿠키를 사용하며, 광고·행태 분석 목적의 쿠키나 외부 분석 도구는 쓰지 않습니다. 브라우저 설정에서 쿠키를 거부할
          수 있지만, 이 경우 로그인이 유지되지 않습니다.
        </p>
      </Section>

      <Section title="8. 안전성 확보 조치">
        <ul className="list-disc space-y-1 pl-5">
          <li>모든 통신 암호화(HTTPS), 비밀번호 단방향 암호화 저장</li>
          <li>로그인·회원 코드 입력 횟수 제한으로 무단 접속 시도 차단</li>
          <li>데이터베이스 외부 접근 차단, 접근 권한 최소화</li>
        </ul>
      </Section>

      <Section title="9. 개인정보 보호책임자">
        <p>
          개인정보 관련 문의·요청·불만은 아래로 연락해 주세요.
          <br />
          개인정보 보호책임자: TraiNote 운영자 ·{' '}
          <a href={`mailto:${CONTACT}`} className="underline underline-offset-2">
            {CONTACT}
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          개인정보 침해 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보분쟁조정위원회(kopico.go.kr, 1833-6972)에도 할 수
          있습니다.
        </p>
      </Section>

      <Section title="10. 변경">
        <p>이 방침이 바뀌면 시행일과 함께 이 페이지에 알립니다.</p>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y rounded-xl border text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="font-semibold">{k}</dt>
          <dd className="text-muted-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
