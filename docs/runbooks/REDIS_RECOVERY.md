# BetArena — Redis Recovery Runbook

**Purpose:** Steps to diagnose and recover from Redis outages or data issues. Redis is used for auth tokens, rate limiting, caching, and distributed locks.

---

## Redis Key Patterns

| Pattern | TTL / Purpose | Impact if Lost |
|---------|---------------|----------------|
| `refresh:<uuid>` | 7 days | All refresh tokens invalid; users must re-login |
| `user_refresh_sessions:<userId>` | 7 days | Session tracking; cleaned up with refresh |
| `bf:<ip>` | 15 min | Brute-force counters; cleared = login attempts reset |
| `prefs:<userId>` | None | User preferences; non-critical |
| `display:live:events` | 60s | Live events display list; auto-refreshed |
| `aggregate:live-events` | 3 min | Sports data aggregate cache; auto-refreshed |
| `result:<eventId>` | 24h | Event results for bet settlement; affects settlement |
| `watchers:<eventId>` | None | Live viewer counts; informational only |
| `odds:<eventId>:<market>` | 10s | Odds cache; auto-refreshed |
| `markets:<eventId>` | ODDS_CACHE_TTL | Event markets; auto-refreshed |
| `lock:jobs:settle-bets` | 55s | Distributed lock; prevents duplicate settlement |
| `*:daily_count:*` | Per key | API budget counters; per-provider |

---

## Outage: Redis Unavailable

**Symptoms:** API logs "Redis connection error", 500s on login, refresh, bet placement.

**Steps:**

1. **Check Redis process**
   - Docker: `docker ps` — verify `betarena-redis` is running
   - Local: `systemctl status redis` or `redis-cli ping`

2. **Restart Redis**
   - Docker: `docker restart betarena-redis`
   - Systemd: `sudo systemctl restart redis`

3. **Verify connection**
   ```bash
   redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
   # Expected: PONG
   ```

4. **API restart**
   - Restart the API so it reconnects to Redis
   - Docker: `docker restart betarena-api`

**User impact:** All logged-in users will need to log in again (refresh tokens lost). Brute-force counters reset. Caches repopulate automatically.

---

## Data Corruption or Flush

If Redis was flushed or data is suspect:

1. **No manual restore** — Redis is used as cache/session store; no persistent backup by default.
2. **Auth:** Users re-login. No data loss for credentials (stored in PostgreSQL).
3. **Caches:** Repopulate on next request (sports, odds, display list).
4. **Locks:** Stale `lock:jobs:*` keys expire by TTL; if stuck, `redis-cli DEL lock:jobs:settle-bets`.

---

## Clear Brute-Force Block

If an IP is locked out after too many failed logins:

```bash
redis-cli DEL "bf:<IP_ADDRESS>"
# Example: redis-cli DEL "bf:192.168.1.100"
```

---

## Clear Stuck Distributed Lock

If bet settlement appears stuck (e.g. lock held by crashed process):

```bash
redis-cli DEL "lock:jobs:settle-bets"
```

The job will retry on the next cron tick; the lock uses `NX` so only one instance holds it.

---

## Memory / Eviction

If Redis hits `maxmemory` and eviction is enabled, volatile keys (TTL) are evicted first. Auth tokens and brute-force keys have TTL; caches repopulate. Monitor with `redis-cli INFO memory`.
