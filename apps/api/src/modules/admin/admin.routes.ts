import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import db from '../../config/database';
import { adminCreateCredits } from '../credits/credits.service';
import {
  createAgent,
  listAgents,
  getAgentById,
  updateAgentStatus,
  updateAgentPrivilege,
  resetUserPassword,
} from './admin.service';
import { validateAdminPIN } from '../../utils/pinValidator';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

async function resolveAgentId(paramId: string): Promise<number> {
  const numeric = Number(paramId);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) return numeric;
  const user = await db('users').where({ display_id: paramId }).first();
  if (!user) throw new Error('AGENT_NOT_FOUND');
  return Number(user.id);
}

router.post('/agents', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const agent = await createAgent(req.user!.id, ip, userAgent);

    res.status(201).json({
      success: true,
      data: agent,
      message: 'Agent created successfully. Save the credentials — they cannot be retrieved again.',
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create agent',
      error: (err as Error).message,
    });
  }
});

router.get('/agents', async (_req: Request, res: Response) => {
  try {
    const agents = await listAgents();
    res.json({ success: true, data: agents, message: 'Agents retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed to list agents', error: (err as Error).message,
    });
  }
});

router.get('/agents/:id', async (req: Request, res: Response) => {
  try {
    const agentId = await resolveAgentId(String(req.params.id));
    const agent = await getAgentById(agentId);
    res.json({ success: true, data: agent, message: 'Agent details', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'AGENT_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

router.patch('/agents/:id/status', async (req: Request, res: Response) => {
  try {
    const is_active = typeof req.body?.is_active === 'boolean'
      ? req.body.is_active
      : req.body?.status === 'active'
        ? true
        : req.body?.status === 'suspended'
          ? false
          : undefined;
    if (typeof is_active !== 'boolean') {
      res.status(400).json({ success: false, data: null, message: 'is_active must be boolean', error: 'INVALID_INPUT' });
      return;
    }
    const agentId = await resolveAgentId(String(req.params.id));
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const result = await updateAgentStatus(agentId, is_active, req.user!.id, ip, userAgent);
    res.json({ success: true, data: result, message: `Agent ${is_active ? 'activated' : 'suspended'}`, error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'AGENT_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

router.patch('/agents/:id/privilege', async (req: Request, res: Response) => {
  try {
    const can_create_sub_agent = typeof req.body?.can_create_sub_agent === 'boolean'
      ? req.body.can_create_sub_agent
      : typeof req.body?.canCreateSubAgent === 'boolean'
        ? req.body.canCreateSubAgent
        : undefined;
    if (typeof can_create_sub_agent !== 'boolean') {
      res.status(400).json({ success: false, data: null, message: 'can_create_sub_agent must be boolean', error: 'INVALID_INPUT' });
      return;
    }
    const agentId = await resolveAgentId(String(req.params.id));
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const result = await updateAgentPrivilege(agentId, can_create_sub_agent, req.user!.id, ip, userAgent);
    res.json({ success: true, data: result, message: `Privilege ${can_create_sub_agent ? 'granted' : 'revoked'}`, error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'AGENT_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

router.post('/credits/create', async (req: Request, res: Response) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ success: false, data: null, message: 'Valid amount required', error: 'INVALID_AMOUNT' });
      return;
    }
    const pinResult = validateAdminPIN(req.body?.pin);
    if (!pinResult.valid) {
      const status = pinResult.errorCode === 'PIN_NOT_CONFIGURED' ? 500 : pinResult.errorCode === 'INVALID_PIN' ? 403 : 400;
      res.status(status).json({ success: false, data: null, message: pinResult.error!, error: pinResult.errorCode! });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const result = await adminCreateCredits(req.user!.id, amount, ip, userAgent);
    res.json({ success: true, data: result, message: 'Credits created', error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to create credits', error: (err as Error).message });
  }
});

router.get('/credits/ledger', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
    const offset = (page - 1) * limit;

    const baseQuery = db('credit_transactions as ct')
      .leftJoin('users as fu', 'ct.from_user_id', 'fu.id')
      .leftJoin('users as tu', 'ct.to_user_id', 'tu.id');

    const [countResult] = await db('credit_transactions').count('id as total');
    const total = Number(countResult?.total) || 0;

    const transactions = await baseQuery
      .clone()
      .select(
        'ct.id',
        'ct.created_at',
        db.raw(`COALESCE(fu.display_id, 'Admin') as from_display_id`),
        db.raw(`COALESCE(fu.username, 'Admin') as from_user`),
        db.raw(`COALESCE(tu.display_id, 'Admin') as to_display_id`),
        db.raw(`COALESCE(tu.username, 'Admin') as to_user`),
        'ct.amount',
        'ct.type'
      )
      .orderBy('ct.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({ success: true, data: { transactions, total }, message: 'Ledger retrieved', error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to retrieve ledger', error: (err as Error).message });
  }
});

router.get('/members', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const baseQuery = db('users as u')
      .leftJoin('credit_accounts as ca', 'u.id', 'ca.user_id')
      .leftJoin('bets as b', 'u.id', 'b.user_id')
      .where('u.role', 'member');

    const [countResult] = await baseQuery.clone().count('u.id as total');
    const total = Number(countResult?.total) || 0;

    const members = await baseQuery
      .clone()
      .groupBy('u.id', 'ca.balance')
      .select(
        'u.id', 'u.display_id', 'u.username', 'u.parent_agent_id',
        'u.is_active', 'u.created_at', 'ca.balance'
      )
      .count('b.id as total_bets')
      .limit(limit)
      .offset(offset);

    res.json({ success: true, data: { data: members, total, page, limit }, message: 'Members retrieved', error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to retrieve members', error: (err as Error).message });
  }
});

router.patch('/members/:id/status', async (req: Request, res: Response) => {
  try {
    const is_active = typeof req.body?.is_active === 'boolean'
      ? req.body.is_active
      : req.body?.status === 'active'
        ? true
        : req.body?.status === 'suspended'
          ? false
          : undefined;
    if (typeof is_active !== 'boolean') {
      res.status(400).json({ success: false, data: null, message: 'is_active must be boolean', error: 'INVALID_INPUT' });
      return;
    }
    const memberId = Number(String(req.params.id));
    await db('users').where({ id: memberId, role: 'member' }).update({ is_active });
    res.json({ success: true, data: { id: memberId, is_active }, message: 'Member status updated', error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to update member status', error: (err as Error).message });
  }
});

router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      res.status(400).json({ success: false, data: null, message: 'Invalid user ID', error: 'INVALID_INPUT' });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const result = await resetUserPassword(userId, req.user!.id, ip, userAgent);
    res.json({ success: true, data: result, message: 'Password reset. Save the new password — it cannot be retrieved again.', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'USER_NOT_FOUND' ? 404 : msg === 'CANNOT_RESET_ADMIN' ? 403 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

export default router;
