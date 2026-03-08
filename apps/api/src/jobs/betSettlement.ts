import db from '../config/database';
import redis from '../config/redis';
import { writeSystemLog } from '../utils/systemLog';
import logger from '../config/logger';
import { combinations, SYSTEM_BET_TYPES, calculatePlaceOdds, isQuarterLine } from '../modules/bets/bets.utils';
import { emitToUser } from '../utils/socketEvents';

interface EventResult {
  id: number | string;
  score: any;
  home_score: number;
  away_score: number;
  total_goals: number;
}

function parseScore(event: any): EventResult | null {
  if (!event || !event.score) return null;
  const score = typeof event.score === 'string' ? JSON.parse(event.score) : event.score;
  const home = parseInt(score.home, 10) || 0;
  const away = parseInt(score.away, 10) || 0;
  return { id: event.id, score, home_score: home, away_score: away, total_goals: home + away };
}

/**
 * Look up a finished event result from either:
 * 1. The DB `events` table (for seeded/persisted events)
 * 2. The Redis `result:{id}` cache (for live API events stored by sports-data.service)
 */
async function getFinishedEventResult(eventId: number | string): Promise<EventResult | null> {
  // 1. Try DB events table
  const dbEvent = await db('events').where({ id: eventId }).first();
  if (dbEvent && dbEvent.status === 'finished') {
    return parseScore(dbEvent);
  }

  // 2. Try Redis results cache (set by sports-data.service when event reaches 'ft')
  try {
    const cached = await redis.get(`result:${eventId}`);
    if (cached) {
      const data = JSON.parse(cached);
      const home = parseInt(data.score?.home, 10) || 0;
      const away = parseInt(data.score?.away, 10) || 0;
      return { id: data.id, score: data.score, home_score: home, away_score: away, total_goals: home + away };
    }
  } catch (err) {
    logger.warn('Redis result lookup failed', { eventId, error: (err as Error).message });
  }

  return null;
}

function didSelectionWin(sel: any, eventResult: EventResult): boolean | null {
  if (!eventResult) return null;
  const name = (sel.selection_name || '').toLowerCase().trim();
  const marketType = (sel.market_type || '').toLowerCase();
  const { home_score, away_score } = eventResult;

  // Both Teams to Score (BTTS): Yes = both scored, No = at least one didn't
  if (marketType === 'btts' || marketType === 'both_teams_to_score') {
    const bothScored = home_score > 0 && away_score > 0;
    if (name === 'yes') return bothScored;
    if (name === 'no') return !bothScored;
  }

  // Correct Score: selection_name like "1-0", "2-1", "0-0"
  if (marketType === 'correct_score' || marketType === 'correct score') {
    const expected = name.replace(/\s/g, '');
    const actual = `${home_score}-${away_score}`;
    return expected === actual;
  }

  // Match Result / 1X2
  if (name === 'home' || name === '1') return home_score > away_score;
  if (name === 'away' || name === '2') return away_score > home_score;
  if (name === 'draw' || name === 'x') return home_score === away_score;

  return true;
}

function settleAsianHandicap(
  sel: any,
  eventResult: EventResult,
  handicapLine: number,
  stake: number,
  odds: number
): { status: 'won' | 'lost' | 'void' | 'half_won' | 'half_lost'; payout: number } {
  const name = (sel.selection_name || '').toLowerCase();
  const { home_score, away_score } = eventResult;

  let goalDiff = home_score - away_score;
  if (name === 'away' || name === '2') goalDiff = away_score - home_score;

  const adjustedDiff = goalDiff + handicapLine;

  if (!isQuarterLine(handicapLine)) {
    if (adjustedDiff > 0) return { status: 'won', payout: stake * odds };
    if (adjustedDiff < 0) return { status: 'lost', payout: 0 };
    return { status: 'void', payout: stake };
  }

  // Quarter line: split into two half bets
  const halfStake = stake / 2;
  const lowerLine = Math.floor(handicapLine * 2) / 2;
  const upperLine = Math.ceil(handicapLine * 2) / 2;

  let payout = 0;
  for (const line of [lowerLine, upperLine]) {
    const adj = goalDiff + line;
    if (adj > 0) payout += halfStake * odds;
    else if (adj === 0) payout += halfStake;
    // adj < 0: lost, payout += 0
  }

  if (payout >= stake * odds) return { status: 'won', payout };
  if (payout <= 0) return { status: 'lost', payout: 0 };
  if (payout === stake) return { status: 'void', payout: stake };
  if (payout > stake) return { status: 'half_won', payout };
  return { status: 'half_lost', payout };
}

function settleOverUnder(
  sel: any,
  eventResult: EventResult,
  totalLine: number,
  stake: number,
  odds: number
): { status: 'won' | 'lost' | 'void'; payout: number } {
  const name = (sel.selection_name || '').toLowerCase();
  const total = eventResult.total_goals;

  if (name.includes('over')) {
    if (total > totalLine) return { status: 'won', payout: stake * odds };
    if (total < totalLine) return { status: 'lost', payout: 0 };
    return { status: 'void', payout: stake };
  }

  if (total < totalLine) return { status: 'won', payout: stake * odds };
  if (total > totalLine) return { status: 'lost', payout: 0 };
  return { status: 'void', payout: stake };
}

export async function settleBets(): Promise<void> {
  try {
    const openBets = await db('bets').where({ status: 'open' });
    if (openBets.length === 0) return;

    for (const bet of openBets) {
      try {
        const selections = typeof bet.selections === 'string' ? JSON.parse(bet.selections) : bet.selections;
        const oddsSnapshot = typeof bet.odds_snapshot === 'string' ? JSON.parse(bet.odds_snapshot) : bet.odds_snapshot;
        const metadata = bet.metadata ? (typeof bet.metadata === 'string' ? JSON.parse(bet.metadata) : bet.metadata) : {};

        // Look up each event's result from DB or Redis cache
        const events = new Map<number | string, EventResult | null>();
        let allFinished = true;

        for (const sel of selections) {
          const eid = sel.event_id;
          if (!events.has(eid)) {
            const result = await getFinishedEventResult(eid);
            events.set(eid, result);
            if (!result) allFinished = false;
          }
        }

        if (!allFinished) continue; // not all events finished yet — skip

        const anyNull = selections.some((s: any) => !events.get(s.event_id));
        if (anyNull) {
          await settleVoid(bet);
          continue;
        }

        let finalStatus: 'won' | 'lost' | 'void';
        let payout = 0;

        switch (bet.type) {
          case 'single':
          case 'accumulator':
            ({ finalStatus, payout } = settleStandardBet(selections, oddsSnapshot, events, Number(bet.stake)));
            break;

          case 'system':
            ({ finalStatus, payout } = settleSystemBet(selections, oddsSnapshot, events, Number(bet.stake), metadata));
            break;

          case 'each_way':
            ({ finalStatus, payout } = settleEachWayBet(selections, oddsSnapshot, events, Number(bet.stake), metadata));
            break;

          case 'asian_handicap':
            ({ finalStatus, payout } = settleAHBet(selections, oddsSnapshot, events, Number(bet.stake), metadata));
            break;

          case 'over_under':
            ({ finalStatus, payout } = settleOUBet(selections, oddsSnapshot, events, Number(bet.stake), metadata));
            break;

          default:
            ({ finalStatus, payout } = settleStandardBet(selections, oddsSnapshot, events, Number(bet.stake)));
        }

        await applySettlement(bet, finalStatus, payout);

      } catch (err) {
        logger.error('Failed to settle bet', { betId: bet.id, error: (err as Error).message });
      }
    }
  } catch (err) {
    logger.error('Bet settlement job failed', { error: (err as Error).message });
  }
}

function settleStandardBet(
  selections: any[], oddsSnapshot: any[], events: Map<number | string, EventResult | null>, stake: number
): { finalStatus: 'won' | 'lost'; payout: number } {
  let allWon = true;
  for (const sel of selections) {
    const result = events.get(sel.event_id)!;
    if (!didSelectionWin(sel, result)) { allWon = false; break; }
  }

  if (allWon) {
    const totalOdds = oddsSnapshot.reduce((acc: number, s: any) => acc * (s.odds_at_placement || 1), 1);
    return { finalStatus: 'won', payout: +(stake * totalOdds).toFixed(2) };
  }
  return { finalStatus: 'lost', payout: 0 };
}

function settleSystemBet(
  selections: any[], oddsSnapshot: any[], events: Map<number | string, EventResult | null>, unitStake: number, metadata: any
): { finalStatus: 'won' | 'lost'; payout: number } {
  const systemType = metadata.system_type;
  const config = SYSTEM_BET_TYPES[systemType];
  if (!config) return { finalStatus: 'lost', payout: 0 };

  const selResults = selections.map((sel: any, i: number) => ({
    won: didSelectionWin(sel, events.get(sel.event_id)!),
    odds: (oddsSnapshot[i] as any).odds_at_placement || 1,
  }));

  let totalPayout = 0;
  for (const size of config.comboSizes) {
    const indices = Array.from({ length: selResults.length }, (_, i) => i);
    const combos = combinations(indices, size);
    for (const combo of combos) {
      const allComboWon = combo.every((idx) => selResults[idx].won);
      if (allComboWon) {
        const comboOdds = combo.reduce((acc, idx) => acc * selResults[idx].odds, 1);
        totalPayout += unitStake * comboOdds;
      }
    }
  }

  return { finalStatus: totalPayout > 0 ? 'won' : 'lost', payout: +totalPayout.toFixed(2) };
}

function settleEachWayBet(
  selections: any[], oddsSnapshot: any[], events: Map<number | string, EventResult | null>, stake: number, metadata: any
): { finalStatus: 'won' | 'lost'; payout: number } {
  const halfStake = stake / 2;
  const odds = (oddsSnapshot[0] as any).odds_at_placement || 1;
  const ewFraction = metadata.ew_fraction || 4;
  const placeOdds = calculatePlaceOdds(odds, ewFraction);

  const sel = selections[0];
  const eventResult = events.get(sel.event_id)!;
  const won = didSelectionWin(sel, eventResult);

  // Simplified: if won, both win and place pay out. If placed (not won), only place pays.
  // Full implementation would check finishing position.
  if (won) {
    return { finalStatus: 'won', payout: +(halfStake * odds + halfStake * placeOdds).toFixed(2) };
  }
  return { finalStatus: 'lost', payout: 0 };
}

function settleAHBet(
  selections: any[], oddsSnapshot: any[], events: Map<number | string, EventResult | null>, stake: number, metadata: any
): { finalStatus: 'won' | 'lost' | 'void'; payout: number } {
  const odds = (oddsSnapshot[0] as any).odds_at_placement || 1;
  const handicapLine = metadata.handicap_line || 0;
  const sel = selections[0];
  const eventResult = events.get(sel.event_id)!;
  const result = settleAsianHandicap(sel, eventResult, handicapLine, stake, odds);

  if (result.status === 'void') return { finalStatus: 'void', payout: result.payout };
  if (result.status === 'won' || result.status === 'half_won') return { finalStatus: 'won', payout: +result.payout.toFixed(2) };
  return { finalStatus: 'lost', payout: +result.payout.toFixed(2) };
}

function settleOUBet(
  selections: any[], oddsSnapshot: any[], events: Map<number | string, EventResult | null>, stake: number, metadata: any
): { finalStatus: 'won' | 'lost' | 'void'; payout: number } {
  const odds = (oddsSnapshot[0] as any).odds_at_placement || 1;
  const totalLine = metadata.total_line || 2.5;
  const sel = selections[0];
  const eventResult = events.get(sel.event_id)!;
  const result = settleOverUnder(sel, eventResult, totalLine, stake, odds);
  return { finalStatus: result.status, payout: +result.payout.toFixed(2) };
}

async function settleVoid(bet: any): Promise<void> {
  const settled = await db.transaction(async (trx) => {
    const updated = await trx('bets')
      .where({ id: bet.id, status: 'open' })
      .update({ status: 'void', settled_at: db.fn.now() });

    if (updated === 0) {
      return false;
    }

    await trx('credit_accounts')
      .where({ user_id: bet.user_id })
      .increment('balance', Number(bet.stake));

    await trx('credit_transactions').insert({
      from_user_id: null,
      to_user_id: bet.user_id,
      amount: bet.stake,
      type: 'create',
      note: `Void bet refund: ${bet.bet_uid}`,
    });

    return true;
  });

  if (!settled) {
    return;
  }

  await writeSystemLog({
    user_id: bet.user_id,
    role: 'member',
    action: 'bet.settle',
    payload: { bet_uid: bet.bet_uid, result: 'void', refund: bet.stake },
    result: 'success',
  });

  const account = await db('credit_accounts').where({ user_id: bet.user_id }).first();
  emitToUser(bet.user_id, 'bet:settled', { betUid: bet.bet_uid, status: 'void', payout: Number(bet.stake) });
  emitToUser(bet.user_id, 'balance:updated', { reason: 'bet.settle.void', balance: account?.balance || 0 });
}

async function applySettlement(bet: any, status: 'won' | 'lost' | 'void', payout: number): Promise<void> {
  if (status === 'void') {
    await settleVoid(bet);
    return;
  }

  let settled = false;

  if (status === 'won') {
    settled = await db.transaction(async (trx) => {
      const updated = await trx('bets')
        .where({ id: bet.id, status: 'open' })
        .update({ status: 'won', actual_win: payout, settled_at: db.fn.now() });

      if (updated === 0) {
        return false;
      }

      await trx('credit_accounts')
        .where({ user_id: bet.user_id })
        .increment('balance', payout);

      await trx('credit_transactions').insert({
        from_user_id: null,
        to_user_id: bet.user_id,
        amount: payout,
        type: 'create',
        note: `Bet won: ${bet.bet_uid}`,
      });

      return true;
    });
  } else {
    const updated = await db('bets')
      .where({ id: bet.id, status: 'open' })
      .update({ status: 'lost', actual_win: '0.00', settled_at: db.fn.now() });
    settled = updated > 0;
  }

  if (!settled) {
    return;
  }

  await writeSystemLog({
    user_id: bet.user_id,
    role: 'member',
    action: 'bet.settle',
    payload: { bet_uid: bet.bet_uid, result: status, actual_win: payout },
    result: 'success',
  });

  const account = await db('credit_accounts').where({ user_id: bet.user_id }).first();
  emitToUser(bet.user_id, 'bet:settled', { betUid: bet.bet_uid, status, payout });
  emitToUser(bet.user_id, 'balance:updated', { reason: `bet.settle.${status}`, balance: account?.balance || 0 });
  logger.info('Bet settled', { betUid: bet.bet_uid, result: status, payout });
}
