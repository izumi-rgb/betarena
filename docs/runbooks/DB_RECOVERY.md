# BetArena — Database Recovery Runbook

**Purpose:** Steps to diagnose and recover from PostgreSQL outages, migration failures, or data issues.

---

## Database Connection

- **Config:** `apps/api/src/config/database.ts`, `apps/api/src/config/knexfile.ts`
- **Vars:** `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **Tables:** `users`, `credit_accounts`, `credit_transactions`, `bets`, `events`, `odds`, `system_logs`

---

## Outage: PostgreSQL Unavailable

**Symptoms:** API fails to start, "connection refused", "password authentication failed", or 500s on any DB operation.

**Steps:**

1. **Check PostgreSQL process**
   - Docker: `docker ps` — verify `betarena-postgres` is running
   - Local: `sudo systemctl status postgresql`

2. **Test connection**
   ```bash
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1"
   # Or with DATABASE_URL:
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Restart PostgreSQL**
   - Docker: `docker restart betarena-postgres`
   - Systemd: `sudo systemctl restart postgresql`

4. **Verify credentials**
   - Ensure `DB_PASSWORD` in `.env` matches the password used by the Postgres container/user.
   - Docker Compose default: `POSTGRES_PASSWORD=betarena_dev_password` — API `.env` must use the same value.

---

## Migration Failures

**Run migrations:**
```bash
npm run migrate --workspace=apps/api
# Or inside Docker:
docker compose exec api npm run migrate
```

**Rollback last migration:**
```bash
cd apps/api && npx knex migrate:rollback --knexfile src/config/knexfile.ts
```

**Check migration status:**
```bash
cd apps/api && npx knex migrate:status --knexfile src/config/knexfile.ts
```

**If migrations fail mid-run:**
1. Check error message (e.g. syntax, constraint violation).
2. Fix the migration file or data, then rerun.
3. Do not rerun a partially applied migration without checking `knex_migrations` table.

---

## Seed Data

**Run seeds (creates admin user, cleans seed events):**
```bash
npm run seed --workspace=apps/api
# Or: docker compose exec api npm run seed
```

**Warning:** Seeds may overwrite or remove data. `001_admin_user.ts` creates/updates the admin user. `002_bet365_sports_events.ts` removes seed-prefixed events. Review seed files before running in production.

---

## Backup and Restore

**Backup (from host):**
```bash
docker compose exec postgres pg_dump -U betarena betarena > backup_$(date +%Y%m%d_%H%M).sql
# Or with local psql:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M).sql
```

**Restore:**
```bash
psql $DATABASE_URL < backup_20250101_1200.sql
# Or: docker compose exec -T postgres psql -U betarena betarena < backup.sql
```

**Note:** Restoring overwrites existing data. Run during maintenance window.

---

## Critical Table Summary

| Table | Purpose |
|-------|---------|
| `users` | Auth, roles, hierarchy (parent_agent_id, created_by) |
| `credit_accounts` | Per-user balance |
| `credit_transactions` | Audit trail of creates, transfers, deducts |
| `bets` | Open/settled bets, odds snapshot |
| `events` | Sports events (scheduled/live/finished) |
| `odds` | Event markets and selections |
| `system_logs` | Immutable action log (INSERT-only) |

---

## Connection Pool Exhausted

If you see "remaining connection slots reserved" or pool errors:

- Knex default pool: `min: 2`, `max: 10`.
- Increase `max` in `apps/api/src/config/database.ts` if needed.
- Check for connection leaks (unreleased clients).
- Restart API to reset pool.
