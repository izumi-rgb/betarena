import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { placeBet, getUserBets, getUserBetStats, cashoutBet, partialCashoutBet } from './bets.service';
import { validateBetInput } from './bets.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole('member'), async (req: Request, res: Response) => {
  try {
    const { type, stake, selections, system_type, each_way, ew_fraction, ew_places, handicap_line, total_line, idempotency_key } = req.body;

    const validation = validateBetInput({ type, stake, selections, system_type, each_way, ew_fraction, ew_places, handicap_line, total_line, idempotency_key });
    if (!validation.valid) {
      res.status(400).json({ success: false, data: null, message: validation.error!, error: 'VALIDATION_ERROR' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';

    const result = await placeBet({
      userId: req.user!.id,
      type,
      stake,
      selections,
      ip,
      userAgent: ua,
      systemType: system_type,
      ewFraction: ew_fraction,
      ewPlaces: ew_places,
      handicapLine: handicap_line,
      totalLine: total_line,
      idempotencyKey: idempotency_key,
    });

    res.status(201).json({ success: true, data: result, message: 'Bet placed successfully', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'INSUFFICIENT_BALANCE' ? 400 : msg.startsWith('ODDS_NOT_FOUND') ? 404 : 400;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

router.get('/my-bets', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string, 10) || 50), 200);
    const result = await getUserBets(req.user!.id, status, page, limit);
    res.json({ success: true, data: result, message: 'Bets retrieved', error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed', error: (err as Error).message });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getUserBetStats(req.user!.id);
    res.json({ success: true, data: stats, message: 'Stats retrieved', error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed', error: (err as Error).message });
  }
});

router.post('/:betUid/cashout', requireRole('member'), async (req: Request, res: Response) => {
  try {
    const betUid = String(req.params.betUid);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';
    const result = await cashoutBet(req.user!.id, betUid, ip, ua);
    res.json({ success: true, data: result, message: 'Cashout successful', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'BET_NOT_FOUND' ? 404 : msg === 'BET_NOT_OPEN' ? 400 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

router.post('/:betUid/cashout/partial', requireRole('member'), async (req: Request, res: Response) => {
  try {
    const betUid = String(req.params.betUid);
    const percent = Number(req.body?.percent);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';
    const result = await partialCashoutBet(req.user!.id, betUid, percent, ip, ua);
    res.json({ success: true, data: result, message: 'Partial cashout successful', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'BET_NOT_FOUND'
      ? 404
      : msg === 'BET_NOT_OPEN' || msg.includes('INVALID') || msg.includes('NOT_ELIGIBLE')
        ? 400
        : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

export default router;
