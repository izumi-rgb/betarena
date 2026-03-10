# Secret Rotation Guide

## Secrets Inventory

| Secret | Env Variable | Rotation Frequency | Notes |
|--------|-------------|-------------------|-------|
| JWT Secret | `JWT_SECRET` | 90 days | Rotating invalidates all active sessions |
| JWT Refresh Secret | `JWT_REFRESH_SECRET` | 90 days | Rotating invalidates all refresh tokens |
| Database Password | `DB_PASSWORD` | 90 days | Update in both DB and .env |
| Redis Password | `REDIS_PASSWORD` | 90 days | Update in Redis config and .env |
| Admin Mint PIN | `ADMIN_MINT_PIN` | 30 days | Used for credit creation |
| API-Sports Key | `APISPORTS_KEY` | As needed | Third-party API key |
| RapidAPI Key | `RAPIDAPI_KEY` | As needed | Third-party API key |
| Odds API IO Key | `ODDS_API_IO_KEY` | As needed | Third-party API key |

## Rotation Procedure

### JWT_SECRET
1. Generate new secret: `openssl rand -hex 64`
2. Update `.env` on VPS
3. Restart API: `docker compose restart api`
4. Note: All users will need to re-login

### DB_PASSWORD
1. Generate new password: `openssl rand -base64 32`
2. Update PostgreSQL: `ALTER USER betarena WITH PASSWORD 'new_password';`
3. Update `.env` on VPS
4. Restart API: `docker compose restart api`

### REDIS_PASSWORD
1. Generate new password: `openssl rand -base64 32`
2. Update `.env` on VPS
3. Restart all services: `docker compose restart`

### ADMIN_MINT_PIN
1. Choose a new PIN (min 4 digits, avoid weak PINs like 1234, 0000, etc.)
2. Update `.env` on VPS
3. Restart API: `docker compose restart api`
4. Communicate new PIN to admin users securely

## Security Checks

Run periodically:
```bash
# Check if .env was ever committed
git log --all --full-history -- '*.env' 'apps/api/.env'

# Check for hardcoded secrets
grep -r "password\|secret\|key" apps/ --include="*.ts" | grep -v node_modules | grep -v ".test."
```
