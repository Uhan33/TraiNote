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
cp apps/web/.env.example apps/web/.env
docker compose up -d                  # 로컬 Postgres 18 (:5432)
pnpm --filter api migration:run       # 테이블 생성
pnpm dev                       # api :4000, web :5173 동시 실행
pnpm --filter web gen:api      # api 실행 중일 때 API 클라이언트 생성 → apps/web/src/api
```

## DB 마이그레이션 (TypeORM)

엔티티(`*.entity.ts`) 수정 후:

```bash
pnpm --filter api migration:generate src/database/migrations/<이름>   # 변경분 SQL 생성
pnpm --filter api migration:run                                       # 적용
pnpm --filter api migration:revert                                    # 마지막 1개 되돌리기
```

`synchronize` 는 쓰지 않는다 — 스키마 변경은 항상 마이그레이션으로.

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
