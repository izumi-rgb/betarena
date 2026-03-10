import { Router, Request, Response } from 'express';
import { listSports, listEventsBySport, getEventMarkets, getLiveEvents, listCompetitionEvents, getSportCounts } from './sports.service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const sports = await listSports();
    res.json({ success: true, data: sports, message: 'Sports listed', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.get('/counts', async (_req: Request, res: Response) => {
  try {
    const counts = await getSportCounts();
    res.json({ success: true, data: counts, message: 'Sport counts', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.get('/live', async (_req: Request, res: Response) => {
  try {
    const events = await getLiveEvents();
    res.json({ success: true, data: events, message: 'Live events', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.get('/:sport/events', async (req: Request, res: Response) => {
  try {
    const events = await listEventsBySport(String(req.params.sport));
    res.json({ success: true, data: events, message: 'Events listed', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.get('/:sport/competitions/:id/events', async (req: Request, res: Response) => {
  try {
    const events = await listCompetitionEvents(String(req.params.sport), String(req.params.id));
    res.json({ success: true, data: events, message: 'Competition events listed', error: null });
  } catch (err) {
    res.status(500).json({
      success: false, data: null, message: 'Failed', error: (err as Error).message,
    });
  }
});

router.get('/events/:id/markets', async (req: Request, res: Response) => {
  try {
    const result = await getEventMarkets(req.params.id as string);
    res.json({ success: true, data: result, message: 'Markets retrieved', error: null });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === 'EVENT_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ success: false, data: null, message: msg, error: msg });
  }
});

export default router;
