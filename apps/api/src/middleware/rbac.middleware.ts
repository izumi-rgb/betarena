import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        data: null,
        message: 'You do not have permission to access this resource',
        error: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
