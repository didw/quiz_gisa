#!/usr/bin/env bash
set -euo pipefail

# 정보보안기사 실기 플래시카드 정적 서버 실행 스크립트
PORT="${PORT:-8080}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "Serving $SCRIPT_DIR at http://0.0.0.0:${PORT}"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
