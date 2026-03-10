#!/bin/bash
set -euo pipefail

# BetArena PostgreSQL Backup Script
# Usage: ./backup-postgres.sh
# Requires: DB_USER, DB_NAME env vars (or uses defaults)

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_USER="${DB_USER:-betarena}"
DB_NAME="${DB_NAME:-betarena}"
DB_HOST="${DB_HOST:-localhost}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/betarena-${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup of ${DB_NAME}..."

pg_dump -h "${DB_HOST}" -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup saved to ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Cleanup old backups
DELETED=$(find "${BACKUP_DIR}" -name "betarena-*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "${DELETED}" -gt 0 ]; then
  echo "[$(date)] Cleaned up ${DELETED} backups older than ${RETENTION_DAYS} days"
fi

echo "[$(date)] Backup complete"
