# 운영 이미지 (deploy/docker-compose.yml 이 target 별로 빌드)
#   api — NestJS. 시작할 때 마이그레이션 실행 후 서버 기동
#   web — Caddy: https 자동 발급 + 웹 정적 파일 + /api → api 프록시

FROM node:24-alpine AS base
# package.json 의 packageManager(pnpm 버전) 그대로 사용
RUN corepack enable
WORKDIR /app

# 의존성 설치 → api·web 빌드
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter api build && pnpm --filter web build

FROM base AS api
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --prod --frozen-lockfile --filter api
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "node node_modules/typeorm/cli.js -d dist/libs/database/data-source.js migration:run && exec node dist/main.js"]

FROM caddy:2-alpine AS web
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv
