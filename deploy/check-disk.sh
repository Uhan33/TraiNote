#!/usr/bin/env bash
# 디스크 사용률이 기준(기본 80%)을 넘으면 알림 메일 — 서버 cron 이 매시간 실행 (README 배포)
set -euo pipefail
cd "$(dirname "$0")/.."
limit=${1:-80}
used=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "$used" -ge "$limit" ]; then
  deploy/alert.sh "디스크 ${used}% 사용" "$(hostname) 디스크 사용률 ${used}% (기준 ${limit}%)

$(df -h /)

$(docker system df)"
fi
