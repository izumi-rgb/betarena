import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  display_id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.access_token;

  if (!token) {
    res.status(401).json({
      success: false,
      data: null,
      message: 'Authentication required',
      error: 'NO_TOKEN',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    logger.debug('JWT verification failed', { error: (err as Error).message });
    res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid or expired token',
      error: 'INVALID_TOKEN',
    });
  }
}
