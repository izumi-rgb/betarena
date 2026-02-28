import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { env } from '../config/env';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.originalUrl,
    });

    res.status(err.statusCode).json({
      success: false,
      data: null,
      message: err.message,
      error: err.message,
    });
    return;
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
  });

  res.status(500).json({
    success: false,
    data: null,
    message: 'Internal server error',
    error: env.NODE_ENV === 'production' ? 'INTERNAL_ERROR' : err.message,
  });
}
