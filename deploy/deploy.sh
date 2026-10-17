#!/usr/bin/env bash
# 서버에서 실행: main 최신 코드로 이미지 빌드 후 교체 (맥에서는 pnpm deploy:prod)
set -euo pipefail
cd "$(dirname "$0")/.."

git fetch --quiet origin main
git checkout --quiet main
git reset --quiet --hard origin/main
echo "배포: $(git log -1 --format='%h %s')"

docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build --remove-orphans
# 안 쓰는 이미지 정리 + 빌드 캐시는 2GB 까지만 (배포마다 쌓여 디스크를 채움, 남긴 캐시로 다음 빌드는 빠르게)
docker image prune -f >/dev/null
docker builder prune -f --max-used-space 2gb >/dev/null
docker compose -f deploy/docker-compose.yml --env-file deploy/.env ps
