#!/bin/bash
set -euo pipefail

# BetArena — Install daily backup cron
# Usage: sudo ./scripts/setup-backup-cron.sh
#
# Creates a daily cron job at 3:00 AM that backs up PostgreSQL.
# Backups are stored in /backups/ with 30-day retention.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-postgres.sh"
CRON_SCHEDULE="0 3 * * *"
CRON_LOG="/var/log/betarena-backup.log"

if [ ! -f "$BACKUP_SCRIPT" ]; then
  echo "ERROR: backup-postgres.sh not found at $BACKUP_SCRIPT"
  exit 1
fi

chmod +x "$BACKUP_SCRIPT"
mkdir -p /backups

# Install cron job (idempotent — removes old entry first)
CRON_CMD="$CRON_SCHEDULE DB_HOST=localhost DB_USER=betarena DB_NAME=betarena BACKUP_DIR=/backups $BACKUP_SCRIPT >> $CRON_LOG 2>&1"

# Remove existing betarena backup cron if present
crontab -l 2>/dev/null | grep -v "backup-postgres.sh" | crontab - 2>/dev/null || true

# Add new cron entry
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "Backup cron installed:"
echo "  Schedule: Daily at 3:00 AM"
echo "  Script:   $BACKUP_SCRIPT"
echo "  Output:   /backups/betarena-*.sql.gz"
echo "  Log:      $CRON_LOG"
echo "  Retention: 30 days"
echo ""
echo "Verify with: crontab -l"
