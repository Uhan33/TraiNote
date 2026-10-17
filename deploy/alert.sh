#!/usr/bin/env bash
# 운영 알림 메일 (SNS → typhoid33@naver.com). 사용: deploy/alert.sh "제목" "내용"
# 권한은 EC2 IAM 역할(이 토픽에 발행만 가능) — 서버에 접근 키를 두지 않음
set -euo pipefail
cd "$(dirname "$0")/.."
set -a && . deploy/.env && set +a
docker run --rm --network host amazon/aws-cli sns publish --region ap-northeast-2 \
  --topic-arn "${ALERT_TOPIC_ARN:?deploy/.env 에 ALERT_TOPIC_ARN 필요}" \
  --subject "[TraiNote] $1" --message "$2" --output text >/dev/null
