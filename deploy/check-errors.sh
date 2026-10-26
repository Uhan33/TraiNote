#!/usr/bin/env bash
# 최근 5분 서버 오류(5xx)가 있으면 알림 메일 — 서버 cron 이 5분마다 실행 (README 배포)
# Caddy 접근 로그 기준이라 api 가 죽어 502 가 나는 경우도 잡힘. 30분에 한 번만 보냄
set -euo pipefail
cd "$(dirname "$0")/.."
stamp=~/.trainote-error-alert
[ -e "$stamp" ] && [ -n "$(find "$stamp" -mmin -30)" ] && exit 0
errors=$(journalctl -t trainote-web -o cat --since '-5min' --no-pager | grep '"status":5' || true)
[ -z "$errors" ] && exit 0
touch "$stamp"
deploy/alert.sh "서버 오류 $(wc -l <<<"$errors")건 (최근 5분)" "$(hostname) 최근 5분 5xx 응답. 30분 동안 추가 알림 없음.

$(head -c 3000 <<<"$errors")

확인: ssh trainote 'journalctl -t trainote-api -o cat --since -10min'"
