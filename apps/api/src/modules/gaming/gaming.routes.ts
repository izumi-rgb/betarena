import { Router, Request, Response } from 'express';
import {
  getGamingLobby,
  getPromotions,
  getRacecards,
  getVirtualSportsFeed,
} from './gaming.service';

const router = Router();

router.get('/lobby', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getGamingLobby(),
    message: 'Gaming lobby loaded',
    error: null,
  });
});

router.get('/promotions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getPromotions(),
    message: 'Promotions loaded',
    error: null,
  });
});

router.get('/racecards', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getRacecards(),
    message: 'Racecards loaded',
    error: null,
  });
});

router.get('/virtual-sports', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getVirtualSportsFeed(),
    message: 'Virtual sports feed loaded',
    error: null,
  });
});

export default router;
