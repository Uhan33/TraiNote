#!/usr/bin/env bash
# 서버에서 실행: main 최신 코드로 이미지 빌드 후 교체 (맥에서는 pnpm deploy:prod)
set -euo pipefail
cd "$(dirname "$0")/.."

git fetch --quiet origin main
git checkout --quiet main
git reset --quiet --hard origin/main
echo "배포: $(git log -1 --format='%h %s')"

docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build --remove-orphans
docker image prune -f >/dev/null
docker compose -f deploy/docker-compose.yml --env-file deploy/.env ps
