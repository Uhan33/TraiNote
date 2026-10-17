#!/usr/bin/env bash
# DB 백업 → S3 (서버 cron 이 매일 실행 — README 배포 참고). 보관 30일은 S3 수명 주기 규칙
# S3 권한은 EC2 IAM 역할(업로드만 가능) — 서버에 접근 키를 두지 않음
set -euo pipefail
cd "$(dirname "$0")/.."
set -a && . deploy/.env && set +a

key="daily/trainote-$(date +%Y%m%d-%H%M).dump"
# pg_dump -Fc: 압축된 덤프 (복원: pg_restore). 실패하면 pipefail 로 스크립트도 실패
docker compose -f deploy/docker-compose.yml --env-file deploy/.env exec -T postgres pg_dump -U trainote -d trainote -Fc |
  docker run --rm -i --network host amazon/aws-cli s3 cp - "s3://${BACKUP_BUCKET:?deploy/.env 에 BACKUP_BUCKET 필요}/$key" --region ap-northeast-2 --only-show-errors
echo "$(date '+%F %T') 백업 완료 s3://$BACKUP_BUCKET/$key"
