#!/usr/bin/env bash
# 링크 미리보기 이미지 생성 (macOS Chrome 헤드리스 캡쳐) — apps/web 에서: bash scripts/gen-og-image.sh
set -euo pipefail
cd "$(dirname "$0")/.."
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,630 --virtual-time-budget=2000 --screenshot="$PWD/public/og-image.png" "file://$PWD/scripts/og-image.html"
