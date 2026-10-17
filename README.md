# TraiNote
A web app for personal trainers to manage their clients’ training and health

## 구성

```
apps/
├── api/   # NestJS — REST API, Swagger(/docs)
└── web/   # React + Vite — 트레이너·회원용 PWA
```

## 시작하기

필요: pnpm 12 (Node 24 LTS 는 pnpm 이 프로젝트 전용으로 자동 설치), Docker

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
docker compose up -d                  # 로컬 Postgres 18 (:5432)
pnpm --filter api migration:run       # 테이블 생성
pnpm dev                       # api :4000, web :5173 동시 실행
pnpm dev:phone                 # 위와 같고 같은 와이파이의 폰에서 http://<맥 IP>:5173 접속 가능
pnpm preview:phone             # 배포용 빌드로 폰 테스트 (PWA 설정 포함) — http://<맥 IP>:4173
pnpm --filter web gen:api      # api 실행 중일 때 API 클라이언트 생성 → apps/web/src/api/generated.ts
```

## DB 마이그레이션 (TypeORM)

엔티티(`*.entity.ts`) 수정 후:

```bash
pnpm --filter api migration:generate src/libs/database/migrations/<이름>   # 변경분 SQL 생성
pnpm --filter api migration:run                                       # 적용
pnpm --filter api migration:revert                                    # 마지막 1개 되돌리기
```

`synchronize` 는 쓰지 않는다 — 스키마 변경은 항상 마이그레이션으로.

## API 구조

- `src/<도메인>/` — `*.service.ts` · `*.controller.ts` · `*.module.ts` · `dto.ts`
- `src/libs/database/` — `entities/` · `repositories/` · `migrations/` · `DatabaseModule`(Global, Repository 전부 제공)
- **쿼리는 Repository 에만.** 서비스는 TypeORM 을 import 하지 않고 Repository 의 도메인 메서드(`findOwned` 등)만 호출
  - `BaseRepository<T>` 의 공통 메서드(`findOneBy`·`find`·`update` …)는 `FindOptions<T>` 타입으로 조건을 검사하고 `protected` — 소프트 삭제 같은 규칙이 Repository 밖으로 새지 않게
- 엔티티 추가 시: `entities/` 에 엔티티 → `data-source.ts` 의 `entities` 에 등록 → `repositories/` 에 `BaseRepository` 상속 Repository → `DatabaseModule` 의 `repositories` 에 등록 → 마이그레이션 생성
- `src/libs/` 의 다른 인프라 모듈(redis·mailer 등)은 필요할 때 같은 위치에 추가
- 주입받는 필드 이름은 **클래스 이름의 camelCase** — `memberRepository: MemberRepository`, `membersService: MembersService`, `jwtService: JwtService` (역할이 이름에 드러나게)

## 배포 (운영 서버)

AWS EC2 1대 (서울, t4g.small) 에서 Docker Compose 로 `web`(Caddy: https·정적 파일·/api 프록시) · `api`(NestJS) · `postgres` 실행. 설정은 `deploy/`.

```bash
pnpm deploy:prod      # 맥에서: 서버가 main 최신 코드를 받아 빌드·교체 (ssh trainote 설정 필요)
```

- 서버 경로 `~/trainote` (GitHub 저장소 clone), 비밀 값은 서버의 `deploy/.env` (`deploy/.env.example` 참고, 커밋 금지)
- api 컨테이너가 시작할 때 마이그레이션을 먼저 실행
- **요청 제한** (봇·대입 공격): IP 당 전체 1분 300회 · 로그인/가입/회원 코드 1분 10회 · 문의 1시간 10회
  - 아이디별 로그인 15분에 10번 실패 → 그 아이디 15분 잠금, 회원 코드 전체(모든 IP 합산) 1분에 30번 실패 → 1분간 코드 입장 중지 (`MEMBER_CODE_FAIL_LIMIT`)
  - 잠기면 로그에 `login_locked` / `member_code_locked` 경고 — 서버 메모리 기준이라 배포(재시작) 시 초기화
- **알림 메일** (SNS `trainote-alerts` → typhoid33@naver.com): 백업 실패, 디스크 80% 초과(`deploy/check-disk.sh`, 서버 cron 매시간). 직접 보내기: `deploy/alert.sh "제목" "내용"`
- 로그: 서버 journald 에 보관 (배포해도 유지, 최대 1GB·30일 — `/etc/systemd/journald.conf.d/trainote.conf`)
  - API: `ssh trainote 'journalctl -t trainote-api -o cat --since today'` — 요청마다 JSON 1줄: `at`(한국 시간)·`method`·`path`·`status`·`ms`·`ip`·`ua`·`trainerId`/`memberId` (회원 코드는 남기지 않음, `/api/health` 제외)
  - 웹(Caddy) 접근 로그(모든 요청): `ssh trainote 'journalctl -t trainote-web -o cat --since today'`
  - 특정 트레이너: `... | grep '<trainerId>'`, 오류만: `... | grep '"status":5'`, 실시간: `-f`
- **백업**: 매일 04:00 `deploy/backup.sh` 가 DB 덤프를 S3 `trainote-backups-847547470208/daily/` 에 업로드 (30일 보관, 서버는 업로드만 가능)
  - cron: 서버 `/etc/cron.d/trainote-backup` → 로그 `~/backup.log`, 실패 시 알림 메일
  - 복원: 맥에서 `aws s3 cp s3://trainote-backups-847547470208/daily/<파일> . --profile uhan` → 서버로 복사 →
    `docker compose -f deploy/docker-compose.yml exec -T postgres pg_restore -U trainote -d trainote --clean --if-exists < <파일>`
- DB 접속: `ssh trainote 'cd trainote && docker compose -f deploy/docker-compose.yml exec postgres psql -U trainote'`

## 문의 확인 (운영)

트레이너가 내 정보 > 문의하기로 보낸 문의는 `inquiry` 테이블에 쌓인다.
**운영자 계정은 앱의 내 정보 > 문의 관리에서 확인·답변** (답변은 트레이너의 문의 내역에 바로 표시).

### 운영자 지정·해제
권한은 API 로 바꿀 수 없고 DB 에서만 지정한다 (매 요청 DB 확인 — 해제하면 즉시 반영). 위 DB 접속 후:

```sql
update trainer set role = 'admin' where login_id = '<내 아이디>';    -- 지정
update trainer set role = 'trainer' where login_id = '<아이디>';     -- 해제
select login_id, name from trainer where role = 'admin';            -- 확인
```

### SQL 로 직접 확인·답변 (화면 대신)

```sql
-- 답변 대기 문의
select i.id, i.created_at, t.login_id, t.name, i.category, i.title, i.content, i.contact, i.app_version, i.user_agent
from inquiry i join trainer t on t.id = i.trainer_id
where i.answer is null
order by i.created_at;

-- 답변 — 트레이너의 내 정보 > 문의 내역에 바로 표시 (줄바꿈은 E'...\n...')
update inquiry set answer = '답변 내용', answered_at = now() where id = '<문의 id>';
```

category: `usage` 사용 방법 · `bug` 오류 신고 · `feature` 기능 제안 · `etc` 기타

## 브랜치

- `develop` — 개발 기본 브랜치. 작업은 여기서(또는 여기서 딴 기능 브랜치에서)
- `main` — 배포용. 배포할 때만 `develop` 을 머지

## 버전

### 릴리즈 버전 — 저장소 전체에 하나

[SemVer](https://semver.org/lang/ko/) `MAJOR.MINOR.PATCH`, **루트 `package.json` 의 `version` 이 유일한 기준**
(apps 에는 version 없음. web 화면·Swagger 문서가 이 값을 자동으로 읽음)

- `0.x.y` — 정식 출시 전. 기능 추가 시 MINOR(`0.1.0 → 0.2.0`), 버그 수정 시 PATCH(`0.1.0 → 0.1.1`)
- `1.0.0` — 정식 출시
- 배포 절차: `develop` → `main` 머지 → 루트 `version` 올림 → `git tag v0.2.0 && git push origin v0.2.0` → web·api 함께 배포

### API 버전 — 릴리즈 버전과 별개

- 일반 API: `/api/v1/...`. **호환이 깨지는 변경**(필드 삭제·의미 변경 등)일 때만 `v2` 추가, 옛 앱이 남아 있는 동안 `v1` 유지
- 필드 추가처럼 호환되는 변경은 같은 버전에서 처리
- 인증 API: `/api/auth/...` (버전 없음 — 리프레시 토큰 쿠키 경로 고정)
