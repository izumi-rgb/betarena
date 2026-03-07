import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import db from '../../config/database';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const action = req.query.action as string | undefined;
    const threat = req.query.threat as string | undefined;
    const userId = req.query.user_id as string | undefined;

    let query = db('system_logs')
      .select('system_logs.*', 'users.username', 'users.display_id')
      .leftJoin('users', 'system_logs.user_id', 'users.id');

    if (action) query = query.where('system_logs.action', action);
    if (threat === 'true') query = query.where('system_logs.threat_flag', true);
    if (userId) query = query.where('system_logs.user_id', parseInt(userId, 10));

    const total = await query.clone().clearSelect().count('system_logs.id as count').first();
    const logs = await query
      .orderBy('system_logs.created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      success: true,
      data: { logs, total: Number(total?.count || 0), page, limit },
      message: 'Logs retrieved',
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

export default router;
