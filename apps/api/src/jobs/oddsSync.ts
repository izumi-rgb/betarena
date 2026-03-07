import db from '../config/database';
import redis from '../config/redis';
import logger from '../config/logger';
import { ODDS_CACHE_TTL_SECONDS } from '../config/constants';

let io: any = null;
let tickCounter = 0;

type IncidentType = 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'corner';
interface LiveIncident {
  minute: number;
  type: IncidentType;
  team: 'home' | 'away';
  player?: string;
}

interface LiveEventRuntime {
  minute: number;
  period: string;
  homeScore: number;
  awayScore: number;
  events: LiveIncident[];
}

const runtimeState = new Map<number, LiveEventRuntime>();

function parseDbScore(raw: any): { home: number; away: number } {
  try {
    const score = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { home: parseInt(score?.home, 10) || 0, away: parseInt(score?.away, 10) || 0 };
  } catch {
    return { home: 0, away: 0 };
  }
}

function periodFromMinute(minute: number): string {
  if (minute < 45) return '1H';
  if (minute === 45) return 'HT';
  if (minute < 90) return '2H';
  return 'FT';
}

function maybeGenerateIncident(state: LiveEventRuntime): LiveIncident | null {
  if (Math.random() > 0.28) return null;
  const pool: IncidentType[] = ['corner', 'yellow_card', 'substitution', 'goal', 'corner', 'yellow_card'];
  const type = pool[Math.floor(Math.random() * pool.length)];
  const team = Math.random() > 0.5 ? 'home' : 'away';
  const incident: LiveIncident = {
    minute: state.minute,
    type,
    team,
    player: `${team === 'home' ? 'Home' : 'Away'} #${Math.floor(Math.random() * 30) + 1}`,
  };
  if (type === 'goal') {
    if (team === 'home') state.homeScore += 1;
    else state.awayScore += 1;
  }
  return incident;
}

export function setSocketIO(socketIO: any) {
  io = socketIO;
}

export async function syncOdds(): Promise<void> {
  try {
    tickCounter += 1;
    const liveEvents = await db('events').where({ status: 'live' });

    for (const event of liveEvents) {
      const odds = await db('odds').where({ event_id: event.id });
      const dbScore = parseDbScore(event.score);
      let state = runtimeState.get(event.id);
      if (!state) {
        state = {
          minute: Math.max(1, Math.floor(Math.random() * 25) + 10),
          period: '1H',
          homeScore: dbScore.home,
          awayScore: dbScore.away,
          events: [],
        };
        runtimeState.set(event.id, state);
      }

      if (process.env.SIMULATE_ODDS === 'true') {
        const shouldAdvanceClock = tickCounter % 2 === 0; // every ~10s with current scheduler
        if (shouldAdvanceClock && state.minute < 90) {
          state.minute += 1;
          state.period = periodFromMinute(state.minute);
          const incident = maybeGenerateIncident(state);
          if (incident) {
            state.events.push(incident);
            if (state.events.length > 30) state.events = state.events.slice(-30);
          }
        }
      }

      for (const market of odds) {
        const cacheKey = `odds:${event.id}:${market.market_type}`;
        await redis.setex(cacheKey, ODDS_CACHE_TTL_SECONDS, JSON.stringify(market));
      }

      if (io && odds.length > 0) {
        const now = Date.now();
        const normalizedMarkets = odds.map((m: any) => {
          const rawSelections = typeof m.selections === 'string' ? JSON.parse(m.selections) : (m.selections || []);
          const stableSeed = String(m.market_type || '').length + (event.id % 5);
          const suspendedWindow = ((Math.floor(now / 5000) + stableSeed) % 7) === 0;
          const suspendedReason = suspendedWindow
            ? (stableSeed % 2 === 0 ? 'trading' : 'var_check')
            : null;
          return {
            marketId: m.market_type,
            selections: rawSelections.map((s: any, idx: number) => ({
              ...s,
              id: s.id || s.name || `${m.market_type}-${idx}`,
              suspended: suspendedWindow && idx % 2 === 0,
              suspended_reason: suspendedWindow && idx % 2 === 0 ? suspendedReason : null,
            })),
          };
        });
        io.to(`event:${event.id}`).emit('odds:update', {
          eventId: event.id,
          markets: normalizedMarkets,
          timestamp: new Date().toISOString(),
        });

        io.to(`event:${event.id}`).emit('event:update', {
          id: event.id,
          currentMinute: state.minute,
          period: state.period,
          homeScore: state.homeScore,
          awayScore: state.awayScore,
          matchEvents: state.events.slice(-12),
        });

        io.emit('live:update', {
          id: event.id,
          homeTeam: { name: event.home_team },
          awayTeam: { name: event.away_team },
          league: event.league,
          sport: event.sport,
          status: 'live',
          homeScore: state.homeScore,
          awayScore: state.awayScore,
          currentMinute: state.minute,
          period: state.period,
          markets: normalizedMarkets.map((m: any) => ({
            id: m.marketId,
            name: m.marketId,
            selections: m.selections,
          })),
        });
      }
    }
  } catch (err) {
    logger.error('Odds sync failed', { error: (err as Error).message });
  }
}
