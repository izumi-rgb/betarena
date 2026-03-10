import db from '../config/database';
import redis from '../config/redis';
import { writeSystemLog } from '../utils/systemLog';
import logger from '../config/logger';
import { combinations, SYSTEM_BET_TYPES, calculatePlaceOdds, isQuarterLine } from '../modules/bets/bets.utils';
import { emitToUser } from '../utils/socketEvents';
import { parseScore as parseScoreRaw } from '../utils/parseScore';

interface EventResult {
  id: number | string;
  score: any;
  home_score: number;
  away_score: number;
  total_goals: number;
}

function parseEventResult(event: { id: number | string; score: unknown } | null | undefined): EventResult | null {
  if (!event) return null;
  const parsed = parseScoreRaw(event.score);
  if (!parsed) return null;
  const rawScore = typeof event.score === 'string' ? JSON.parse(event.score) : event.score;
  return { id: event.id, score: rawScore, home_score: parsed.home, away_score: parsed.away, total_goals: parsed.total };
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
    return parseEventResult(dbEvent);
  }

  // 2. Try Redis results cache (set by sports-data.service when event reaches 'ft')
  try {
    const cached = await redis.get(`result:${eventId}`);
    if (cached) {
      const data = JSON.parse(cached);
      const parsed = parseScoreRaw(data.score);
      if (parsed) {
        return { id: data.id, score: data.score, home_score: parsed.home, away_score: parsed.away, total_goals: parsed.total };
      }
    }
  } catch (err) {
    logger.warn('Redis result lookup failed', { eventId, error: (err as Error).message });
  }

  return null;
}

export function didSelectionWin(sel: any, eventResult: EventResult): boolean | null {
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

  return null;
}

export function settleAsianHandicap(
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

export function settleOverUnder(
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
    const openBets = await db('bets').where({ status: 'open' }).limit(500);
    if (openBets.length === 0) return;

    for (const bet of openBets) {
      try {
        const selections = typeof bet.selections === 'string' ? JSON.parse(bet.selections) : bet.selections;
        const oddsSnapshot = typeof bet.odds_snapshot === 'string' ? JSON.parse(bet.odds_snapshot) : bet.odds_snapshot;
        const metadata = bet.metadata ? (typeof bet.metadata === 'string' ? JSON.parse(bet.metadata) : bet.metadata) : {};

        // Look up each event's result from DB or Redis cache
        const events = new Map<number | string, EventResult | null>();
        let allFinished = true;

        // Batch fetch: collect unique event IDs
        const uniqueEventIds = Array.from(new Set<number | string>(selections.map((s: any) => s.event_id)));
        const missingIds = uniqueEventIds.filter((eid) => !events.has(eid));

        if (missingIds.length > 0) {
          // Separate numeric (DB) and non-numeric (Redis) IDs
          const numericIds = missingIds.filter((id): id is number | string => /^\d+$/.test(String(id)));
          const nonNumericIds = missingIds.filter((id): id is number | string => !/^\d+$/.test(String(id)));

          // Batch DB query for numeric IDs
          if (numericIds.length > 0) {
            const dbEvents = await db('events').whereIn('id', numericIds).where({ status: 'finished' });
            for (const dbEvent of dbEvents) {
              events.set(dbEvent.id, parseEventResult(dbEvent));
            }
            // Mark missing DB events as null (not finished yet)
            for (const id of numericIds) {
              if (!events.has(id)) {
                // Try Redis fallback for numeric IDs too
                try {
                  const cached = await redis.get(`result:${id}`);
                  if (cached) {
                    const data = JSON.parse(cached);
                    const home = parseInt(data.score?.home, 10) || 0;
                    const away = parseInt(data.score?.away, 10) || 0;
                    events.set(id, { id: data.id, score: data.score, home_score: home, away_score: away, total_goals: home + away });
                  } else {
                    events.set(id, null);
                  }
                } catch {
                  events.set(id, null);
                }
              }
            }
          }

          // Batch Redis query for non-numeric IDs
          if (nonNumericIds.length > 0) {
            const redisKeys = nonNumericIds.map((id) => `result:${id}`);
            try {
              const results = await redis.mget(...redisKeys);
              for (let i = 0; i < nonNumericIds.length; i++) {
                const id = nonNumericIds[i];
                const cached = results[i];
                if (cached) {
                  const data = JSON.parse(cached);
                  const home = parseInt(data.score?.home, 10) || 0;
                  const away = parseInt(data.score?.away, 10) || 0;
                  events.set(id, { id: data.id, score: data.score, home_score: home, away_score: away, total_goals: home + away });
                } else {
                  events.set(id, null);
                }
              }
            } catch (err) {
              logger.warn('Redis batch result lookup failed', { error: (err as Error).message });
              for (const id of nonNumericIds) {
                if (!events.has(id)) events.set(id, null);
              }
            }
          }
        }

        // Check if all events are finished
        for (const sel of selections) {
          if (!events.get(sel.event_id)) {
            allFinished = false;
            break;
          }
        }

        if (!allFinished) continue; // not all events finished yet — skip

        // Pre-check: if any selection has an unknown market type, skip settlement
        const hasUnknownMarket = selections.some((sel: any) => {
          const eventResult = events.get(sel.event_id);
          if (!eventResult) return false;
          return didSelectionWin(sel, eventResult) === null;
        });
        if (hasUnknownMarket) {
          logger.warn('Bet has unknown market type, skipping settlement', { betId: bet.id });
          continue;
        }

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

    // Void stale bets: open for > 72 hours with no matching event
    try {
      const staleBets = await db('bets')
        .where({ status: 'open' })
        .whereRaw("created_at < NOW() - INTERVAL '72 hours'")
        .limit(100);

      for (const staleBet of staleBets) {
        try {
          const selections = typeof staleBet.selections === 'string' ? JSON.parse(staleBet.selections) : staleBet.selections;
          // Check if any event is still active (not finished and not missing)
          let anyEventActive = false;
          for (const sel of selections) {
            const result = await getFinishedEventResult(sel.event_id);
            if (!result) {
              // Event not finished — could still be active, or could be missing
              // Check if event exists at all
              const dbEvent = await db('events').where({ id: sel.event_id }).first();
              if (dbEvent && dbEvent.status !== 'finished' && dbEvent.status !== 'cancelled') {
                anyEventActive = true;
                break;
              }
            }
          }

          if (!anyEventActive) {
            await settleVoid(staleBet);
            logger.info('Voided stale bet', { betId: staleBet.id, betUid: staleBet.bet_uid, age: '72h+' });
          }
        } catch (err) {
          logger.error('Failed to void stale bet', { betId: staleBet.id, error: (err as Error).message });
        }
      }
    } catch (err) {
      logger.error('Stale bet voiding failed', { error: (err as Error).message });
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
    if (didSelectionWin(sel, result) !== true) { allWon = false; break; }
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
      const allComboWon = combo.every((idx) => selResults[idx].won === true);
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
): { finalStatus: 'won' | 'lost' | 'void'; payout: number } {
  const halfStake = stake / 2;
  const odds = (oddsSnapshot[0] as any).odds_at_placement || 1;
  const ewFraction = metadata.ew_fraction || 4;
  const ewPlaces = metadata.ew_places || 3;
  const placeOdds = calculatePlaceOdds(odds, ewFraction);

  const sel = selections[0];
  const eventResult = events.get(sel.event_id)!;
  const won = didSelectionWin(sel, eventResult);

  // If we can't determine the result (unknown market), void the bet (safe default)
  if (won === null) {
    return { finalStatus: 'void', payout: stake };
  }

  // Check for finishing position in metadata for place determination
  const finishingPosition = metadata.finishing_position;

  if (won) {
    // Win: both win part and place part pay out
    return { finalStatus: 'won', payout: +(halfStake * odds + halfStake * placeOdds).toFixed(2) };
  }

  if (finishingPosition && finishingPosition <= ewPlaces) {
    // Placed but didn't win: only place part pays out
    return { finalStatus: 'won', payout: +(halfStake * placeOdds).toFixed(2) };
  }

  if (!finishingPosition) {
    // No position data available — void to be safe
    return { finalStatus: 'void', payout: stake };
  }

  // Didn't win and didn't place
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
  if (result.payout > 0) return { finalStatus: 'won', payout: +result.payout.toFixed(2) };
  return { finalStatus: 'lost', payout: 0 };
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
      from_user_id: 0,
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
        from_user_id: 0,
        to_user_id: bet.user_id,
        amount: payout,
        type: 'create',
        note: `Bet won: ${bet.bet_uid}`,
      });

      return true;
    });
  } else {
    settled = await db.transaction(async (trx) => {
      const updated = await trx('bets')
        .where({ id: bet.id, status: 'open' })
        .update({ status: 'lost', actual_win: '0.00', settled_at: db.fn.now() });
      return updated > 0;
    });
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
