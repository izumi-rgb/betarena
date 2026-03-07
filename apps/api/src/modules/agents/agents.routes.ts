import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import db from '../../config/database';
import {
  createMember,
  listMembers,
  getMemberDetail,
  createSubAgent,
  listSubAgents,
  updateSubAgentPrivilege,
  resetChildPassword,
} from './agents.service';

const router = Router();

router.use(authMiddleware, requireRole('agent', 'sub_agent'));

router.post('/members', async (req: Request, res: Response) => {
  try {
    const { nickname } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';
    const member = await createMember(req.user!.id, req.user!.role, req.user!.display_id, nickname, ip, ua);
    res.status(201).json({
      success: true,
      data: member,
      message: 'Member created. Save the credentials — they cannot be retrieved again.',
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed to create member', error: (err as Error).message,
    });
  }
});

router.get('/members', async (req: Request, res: Response) => {
  try {
    const members = await listMembers(req.user!.id);
    res.json({ success: true, data: members, message: 'Members retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.get('/members/:id', async (req: Request, res: Response) => {
  try {
    const member = await getMemberDetail(req.user!.id, parseInt(String(req.params.id), 10));
    res.json({ success: true, data: member, message: 'Member details', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    res.status(msg === 'MEMBER_NOT_FOUND' ? 404 : 500).json({
      success: false, data: null, message: msg, error: msg,
    });
  }
});

router.patch('/members/:id/status', async (req: Request, res: Response) => {
  try {
    const memberId = parseInt(String(req.params.id), 10);
    const is_active = typeof req.body?.is_active === 'boolean'
      ? req.body.is_active
      : req.body?.status === 'active'
        ? true
        : req.body?.status === 'suspended'
          ? false
          : undefined;

    if (!Number.isFinite(memberId) || typeof is_active !== 'boolean') {
      res.status(400).json({
        success: false, data: null, message: 'Invalid input', error: 'INVALID_INPUT',
      });
      return;
    }

    const member = await db('users')
      .where({ id: memberId, parent_agent_id: req.user!.id, role: 'member' })
      .first();
    if (!member) {
      res.status(404).json({ success: false, data: null, message: 'MEMBER_NOT_FOUND', error: 'MEMBER_NOT_FOUND' });
      return;
    }

    await db('users').where({ id: memberId }).update({ is_active });
    res.json({ success: true, data: { id: memberId, is_active }, message: 'Member status updated', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.get('/members/:id/bets', async (req: Request, res: Response) => {
  try {
    const memberId = parseInt(String(req.params.id), 10);
    const member = await db('users')
      .where({ id: memberId, parent_agent_id: req.user!.id, role: 'member' })
      .first();
    if (!member) {
      res.status(404).json({ success: false, data: null, message: 'MEMBER_NOT_FOUND', error: 'MEMBER_NOT_FOUND' });
      return;
    }

    const bets = await db('bets')
      .select('id', 'bet_uid', 'type', 'status', 'stake', 'potential_win', 'actual_win', 'created_at')
      .where({ user_id: memberId })
      .orderBy('created_at', 'desc')
      .limit(300);

    res.json({ success: true, data: bets, message: 'Member bets retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.get('/members/:id/credits', async (req: Request, res: Response) => {
  try {
    const memberId = parseInt(String(req.params.id), 10);
    const member = await db('users')
      .where({ id: memberId, parent_agent_id: req.user!.id, role: 'member' })
      .first();
    if (!member) {
      res.status(404).json({ success: false, data: null, message: 'MEMBER_NOT_FOUND', error: 'MEMBER_NOT_FOUND' });
      return;
    }

    const transfers = await db('credit_transactions as ct')
      .leftJoin('users as fu', 'ct.from_user_id', 'fu.id')
      .select(
        'ct.id',
        'ct.created_at as date',
        'ct.amount',
        db.raw(`COALESCE(fu.display_id, 'Admin') as by`)
      )
      .where('ct.to_user_id', memberId)
      .orderBy('ct.created_at', 'desc')
      .limit(300);

    res.json({ success: true, data: transfers, message: 'Member credits retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.post('/sub-agents', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';

    const user = await require('../../config/database').default('users').where({ id: req.user!.id }).first();
    const subAgent = await createSubAgent(
      req.user!.id, req.user!.role, req.user!.display_id,
      user.can_create_sub_agent, ip, ua
    );
    res.status(201).json({
      success: true,
      data: subAgent,
      message: 'Sub-agent created. Save the credentials — they cannot be retrieved again.',
      error: null,
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'NO_SUB_AGENT_PRIVILEGE' ? 403 : 500;
    res.status(status).json({
      success: false, data: null, message: msg, error: msg,
    });
  }
});

router.get('/sub-agents', async (req: Request, res: Response) => {
  try {
    const subAgents = await listSubAgents(req.user!.id);
    res.json({ success: true, data: subAgents, message: 'Sub-agents retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const targetId = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ success: false, data: null, message: 'Invalid user ID', error: 'INVALID_INPUT' });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';
    const result = await resetChildPassword(req.user!.id, req.user!.role, targetId, ip, ua);
    res.json({ success: true, data: result, message: 'Password reset. Save the new password — it cannot be retrieved again.', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'USER_NOT_FOUND' ? 404 : msg === 'NOT_AUTHORIZED' ? 403 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

router.patch('/sub-agents/:id/privilege', async (req: Request, res: Response) => {
  try {
    const { can_create_sub_agent } = req.body;
    if (typeof can_create_sub_agent !== 'boolean') {
      res.status(400).json({
        success: false, data: null, message: 'can_create_sub_agent must be boolean', error: 'INVALID_INPUT',
      });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';
    const result = await updateSubAgentPrivilege(
      req.user!.id, parseInt(String(req.params.id), 10),
      can_create_sub_agent, req.user!.role, ip, ua
    );
    res.json({ success: true, data: result, message: 'Privilege updated', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'SUB_AGENT_NOT_FOUND' ? 404 : msg === 'NO_SUB_AGENT_PRIVILEGE' ? 403 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

export default router;
