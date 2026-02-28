import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import { scanRequestForSqli } from '../utils/sqliDetector';
import { writeSystemLog } from '../utils/systemLog';
import logger from '../config/logger';

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return xss(value.trim());
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return value;
}

export function sanitizeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sqliResult = scanRequestForSqli(req.body, req.query, req.params);

  if (sqliResult) {
    const userId = (req as any).user?.id || null;
    const userRole = (req as any).user?.role || null;

    logger.warn('SQLi attempt detected', {
      ip: req.ip,
      path: req.originalUrl,
      pattern: sqliResult.matchedPattern,
      input: sqliResult.input,
    });

    writeSystemLog({
      user_id: userId,
      role: userRole,
      action: 'sqli.attempt',
      ip_address: req.ip || req.socket.remoteAddress || null,
      user_agent: req.get('user-agent') || null,
      payload: {
        path: req.originalUrl,
        method: req.method,
        pattern: sqliResult.matchedPattern,
        input: sqliResult.input,
      },
      result: 'blocked',
      threat_flag: true,
    });

    res.status(400).json({
      success: false,
      data: null,
      message: 'Invalid input detected',
      error: 'Request blocked due to suspicious input',
    });
    return;
  }

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query) as any;

  next();
}
