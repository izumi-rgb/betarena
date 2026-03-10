import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';
import db from '../config/database';

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

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    const user = await db('users')
      .select('id', 'username', 'role', 'display_id', 'is_active')
      .where({ id: decoded.id })
      .first();

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'User is inactive or no longer available',
        error: 'USER_INACTIVE',
      });
      return;
    }

    req.user = { ...decoded, role: user.role, display_id: user.display_id };
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
