#!/bin/bash
set -euo pipefail

# BetArena — Health check script
# Usage: ./scripts/health-check.sh [BASE_URL]
# Returns exit code 0 if healthy, 1 if any check fails.
# Can be used with uptime monitors (UptimeRobot, cron, etc.)

BASE_URL="${1:-http://localhost}"
FAILED=0

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

  if [ "$STATUS" = "$expected" ]; then
    echo "  [PASS] $name ($STATUS)"
  else
    echo "  [FAIL] $name (got $STATUS, expected $expected)"
    FAILED=1
  fi
}

echo "BetArena Health Check — $(date)"
echo "Base URL: $BASE_URL"
echo ""

# Core checks
check "API Health"       "$BASE_URL/api/health"
check "Web Frontend"     "$BASE_URL"
check "Sports API"       "$BASE_URL/api/sports/live"

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "All checks PASSED"
else
  echo "Some checks FAILED"
  exit 1
fi
