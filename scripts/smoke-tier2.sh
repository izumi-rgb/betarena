#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:4000}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-admin123!}"

COOKIE_JAR="/tmp/bitarena-smoke.cookies"
rm -f "$COOKIE_JAR"

echo "[1/4] health"
curl -sS -f "$API_BASE/api/health" >/dev/null

echo "[2/4] login (admin)"
LOGIN_CODE=$(curl -sS -o /tmp/bitarena-login.json -w '%{http_code}' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}" \
  "$API_BASE/api/auth/login")
[[ "$LOGIN_CODE" == "200" ]] || { echo "login failed: $LOGIN_CODE"; cat /tmp/bitarena-login.json; exit 1; }

check() {
  local method="$1"; shift
  local path="$1"; shift
  local body="${1:-}"
  local code
  if [[ -n "$body" ]]; then
    code=$(curl -sS -o /tmp/bitarena-resp.json -w '%{http_code}' -X "$method" \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR" -H 'Content-Type: application/json' \
      -d "$body" "$API_BASE$path")
  else
    code=$(curl -sS -o /tmp/bitarena-resp.json -w '%{http_code}' -X "$method" \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$API_BASE$path")
  fi
  echo "$code $method $path"
}

echo "[3/4] endpoint checks"
check GET  '/api/auth/me'
check PATCH '/api/auth/preferences' '{"oddsFormat":"decimal","timezone":"UTC","notifyBetSettled":true,"notifyOddsMovement":true,"notifyCreditReceived":true}'
check POST '/api/auth/change-password' '{"currentPassword":"admin123!","newPassword":"admin123!","confirmPassword":"admin123!"}'
check GET '/api/sports'
check GET '/api/sports/live'
check GET '/api/sports/tennis/events'
check GET '/api/sports/basketball/events'
check GET '/api/sports/golf/events'
check GET '/api/sports/esports/events'
check GET '/api/sports/events/1/markets?sport=tennis'
check GET '/api/sports/football/competitions/1/events'
check GET '/api/results?sport=&date=2026-02-25&competition='
check GET '/api/credits/transactions'
check GET '/api/admin/agents'
check GET '/api/admin/agents/1'
check PATCH '/api/admin/agents/1/status' '{"status":"active"}'
check PATCH '/api/admin/agents/1/privilege' '{"canCreateSubAgent":false}'
check POST '/api/admin/credits/create' '{"amount":100}'
check GET '/api/admin/credits/ledger'
check GET '/api/admin/members'
check PATCH '/api/admin/members/1/status' '{"status":"active"}'
check GET '/api/agents/members'
check GET '/api/agents/sub-agents'
check GET '/api/agents/members/1/bets'
check GET '/api/agents/members/1/credits'

echo "[4/4] done"
