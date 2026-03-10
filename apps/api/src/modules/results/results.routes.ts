import { Router, Request, Response } from 'express';
import db from '../../config/database';
import { toSlug } from '../../utils/slug';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const sport = String(req.query.sport || '').trim();
    const date = String(req.query.date || '').trim();
    const competition = String(req.query.competition || '').trim();

    let query = db('events').where({ status: 'finished' }).orderBy('starts_at', 'desc');

    if (sport) {
      query = query.whereRaw('lower(sport) = ?', [sport.toLowerCase()]);
    }

    if (date) {
      query = query.whereRaw('DATE(starts_at) = ?', [date]);
    }

    const rows = await query.limit(300);

    const filtered = competition
      ? rows.filter((r: any) => toSlug(r.league || '').includes(toSlug(competition)))
      : rows;

    const data = filtered.map((r: any) => {
      const score = r.score ? (typeof r.score === 'string' ? JSON.parse(r.score) : r.score) : null;
      return {
        id: r.id,
        sport: r.sport,
        competition: r.league,
        homeTeam: r.home_team,
        awayTeam: r.away_team,
        score: {
          home: Number(score?.home || 0),
          away: Number(score?.away || 0),
        },
        status: 'finished',
        startsAt: r.starts_at,
      };
    });

    res.json({ success: true, data, message: 'Results retrieved', error: null });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve results',
      error: (err as Error).message,
    });
  }
});

export default router;
