import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import {
  adminCreateCredits,
  transferCredits,
  getBalance,
  getTransactions,
  adminCreditsOverview,
} from './credits.service';
import { validateAdminPIN } from '../../utils/pinValidator';

const router = Router();

router.use(authMiddleware);

// Admin-only: create credits (requires security PIN)
router.post('/admin/create', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { amount, pin } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ success: false, data: null, message: 'Valid amount required', error: 'INVALID_AMOUNT' });
      return;
    }
    const pinResult = validateAdminPIN(pin);
    if (!pinResult.valid) {
      const status = pinResult.errorCode === 'PIN_NOT_CONFIGURED' ? 500 : pinResult.errorCode === 'INVALID_PIN' ? 403 : 400;
      res.status(status).json({ success: false, data: null, message: pinResult.error!, error: pinResult.errorCode! });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';
    const result = await adminCreateCredits(req.user!.id, amount, ip, ua);
    res.json({ success: true, data: result, message: 'Credits created', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

// Admin-only: overview
router.get('/admin/overview', requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const overview = await adminCreditsOverview();
    res.json({ success: true, data: overview, message: 'Overview retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

// Transfer credits to subordinate
router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const { to_user_id, amount } = req.body;
    if (!to_user_id || !amount || amount <= 0) {
      res.status(400).json({
        success: false, data: null, message: 'to_user_id and positive amount required', error: 'INVALID_INPUT',
      });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';
    const result = await transferCredits(req.user!.id, req.user!.role, to_user_id, amount, ip, ua);
    res.json({ success: true, data: result, message: 'Transfer successful', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'INSUFFICIENT_BALANCE' ? 400 :
      msg === 'NOT_DIRECT_SUBORDINATE' ? 403 :
      msg === 'RECEIVER_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

// Get own balance
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const balance = await getBalance(req.user!.id);
    res.json({ success: true, data: balance, message: 'Balance retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

// Get own transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string, 10) || 50), 200);
    const result = await getTransactions(req.user!.id, page, limit);
    res.json({ success: true, data: result, message: 'Transactions retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

export default router;
