import db from '../config/database';
import logger from '../config/logger';

interface LogEntry {
  user_id?: number | null;
  role?: string | null;
  action: string;
  ip_address?: string | null;
  user_agent?: string | null;
  payload?: Record<string, unknown> | null;
  result: 'success' | 'failure' | 'blocked';
  threat_flag?: boolean;
}

export async function writeSystemLog(entry: LogEntry): Promise<void> {
  try {
    await db('system_logs').insert({
      user_id: entry.user_id || null,
      role: entry.role || null,
      action: entry.action,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      payload: entry.payload ? JSON.stringify(entry.payload) : null,
      result: entry.result,
      threat_flag: entry.threat_flag || false,
    });
  } catch (err) {
    logger.error('Failed to write system log', { error: err, entry });
  }
}
