import { v4 as uuidv4 } from 'uuid';
import db from '../../config/database';
import { writeSystemLog } from '../../utils/systemLog';
import { combinations, SYSTEM_BET_TYPES, calculatePlaceOdds, isQuarterLine, getSystemBetCount } from './bets.utils';
import { emitToUser } from '../../utils/socketEvents';
import { getLiveEvents, getMarkets } from '../sports-data/sports-data.service';

interface BetSelection {
  event_id: number | string;
  market_type: string;
  selection_name: string;
  odds: number;
}

interface PlaceBetParams {
  userId: number;
  type: string;
  stake: number;
  selections: BetSelection[];
  ip: string;
  userAgent: string;
  systemType?: string;
  ewFraction?: number;
  ewPlaces?: number;
  handicapLine?: number;
  totalLine?: number;
}

async function snapshotOdds(selections: BetSelection[]) {
  const snapshot: Record<string, unknown>[] = [];
  let totalOdds = 1;

  for (const sel of selections) {
    // Try DB lookup first (for seeded/persisted events with numeric IDs)
    const eventIdStr = String(sel.event_id);
    const isNumericId = /^\d+$/.test(eventIdStr);
    const oddsRow = isNumericId
      ? await db('odds').where({ event_id: sel.event_id, market_type: sel.market_type }).first()
      : null;

    if (oddsRow) {
      // DB odds found — use server-side odds (prevents manipulation)
      const parsedSelections = typeof oddsRow.selections === 'string'
        ? JSON.parse(oddsRow.selections)
        : oddsRow.selections;

      const matchedSel = parsedSelections.find((s: any) => s.name === sel.selection_name);
      if (!matchedSel) throw new Error(`SELECTION_NOT_FOUND:${sel.selection_name}`);

      snapshot.push({
        event_id: sel.event_id,
        market_type: sel.market_type,
        selection_name: sel.selection_name,
        odds_at_placement: matchedSel.odds,
      });
      totalOdds *= matchedSel.odds;
    } else {
      const eventId = String(sel.event_id);
      const aggregate = await getLiveEvents();
      const aggregateEvent = [...aggregate.live, ...aggregate.upcoming]
        .find((event) => String(event.id) === eventId);
      const candidateMarkets = aggregateEvent?.markets?.length
        ? aggregateEvent.markets
        : await getMarkets(eventId);
      const matchedMarket = (candidateMarkets || []).find((market) => {
        return market.id === sel.market_type
          || market.name.toLowerCase() === sel.market_type.toLowerCase();
      });
      const matchedSelection = matchedMarket?.selections.find((selection) => selection.name === sel.selection_name);

      if (matchedMarket && matchedSelection) {
        // Server-verified odds from aggregate cache
        snapshot.push({
          event_id: eventId,
          market_type: sel.market_type,
          selection_name: sel.selection_name,
          odds_at_placement: matchedSelection.odds,
        });
        totalOdds *= matchedSelection.odds;
      } else if (!isNumericId && sel.odds > 1 && sel.odds < 500) {
        // Live API event rotated out of display cache — accept client odds
        // (these came from our own system: real provider or synthetic house odds)
        snapshot.push({
          event_id: eventId,
          market_type: sel.market_type,
          selection_name: sel.selection_name,
          odds_at_placement: sel.odds,
        });
        totalOdds *= sel.odds;
      } else {
        throw new Error(`ODDS_NOT_AVAILABLE:${eventId}:${sel.market_type}:${sel.selection_name}`);
      }
    }
  }

  return { snapshot, totalOdds };
}

function placeSingleOrAccumulator(stake: number, totalOdds: number) {
  return { potentialWin: +(stake * totalOdds).toFixed(2), totalStake: stake };
}

function placeSystemBet(stake: number, selections: { odds_at_placement: number }[], systemType: string) {
  const config = SYSTEM_BET_TYPES[systemType];
  const betCount = getSystemBetCount(selections.length, config.comboSizes);
  const unitStake = stake;
  const totalStake = unitStake * betCount;

  let totalPotentialWin = 0;
  for (const size of config.comboSizes) {
    const combos = combinations(selections, size);
    for (const combo of combos) {
      const comboOdds = combo.reduce((acc, s) => acc * (s.odds_at_placement as number), 1);
      totalPotentialWin += unitStake * comboOdds;
    }
  }

  return {
    potentialWin: +totalPotentialWin.toFixed(2),
    totalStake: +totalStake.toFixed(2),
    betCount,
    unitStake,
  };
}

function placeEachWayBet(stake: number, decimalOdds: number, ewFraction: number) {
  const halfStake = stake / 2;
  const placeOdds = calculatePlaceOdds(decimalOdds, ewFraction);
  const winReturn = halfStake * decimalOdds;
  const placeReturn = halfStake * placeOdds;

  return {
    potentialWin: +(winReturn + placeReturn).toFixed(2),
    totalStake: stake,
    winOdds: decimalOdds,
    placeOdds: +placeOdds.toFixed(4),
    winStake: halfStake,
    placeStake: halfStake,
  };
}

export async function placeBet(params: PlaceBetParams) {
  const { userId, type, stake, selections, ip, userAgent, systemType, ewFraction, ewPlaces, handicapLine, totalLine } = params;

  if (stake <= 0) throw new Error('INVALID_STAKE');
  if (!selections || selections.length === 0) throw new Error('NO_SELECTIONS');

  const { snapshot, totalOdds } = await snapshotOdds(selections);

  let potentialWin: number;
  let totalStake: number;
  let metadata: Record<string, unknown> = {};

  switch (type) {
    case 'single': {
      if (selections.length !== 1) throw new Error('SINGLE_BET_ONE_SELECTION');
      const result = placeSingleOrAccumulator(stake, totalOdds);
      potentialWin = result.potentialWin;
      totalStake = result.totalStake;
      break;
    }

    case 'accumulator': {
      if (selections.length < 2) throw new Error('ACCUMULATOR_MIN_TWO');
      const result = placeSingleOrAccumulator(stake, totalOdds);
      potentialWin = result.potentialWin;
      totalStake = result.totalStake;
      break;
    }

    case 'system': {
      if (!systemType || !SYSTEM_BET_TYPES[systemType]) throw new Error('INVALID_SYSTEM_TYPE');
      const result = placeSystemBet(stake, snapshot as any[], systemType);
      potentialWin = result.potentialWin;
      totalStake = result.totalStake;
      metadata = { system_type: systemType, bet_count: result.betCount, unit_stake: result.unitStake };
      break;
    }

    case 'each_way': {
      if (selections.length !== 1) throw new Error('EW_ONE_SELECTION');
      if (!ewFraction) throw new Error('EW_FRACTION_REQUIRED');
      const selOdds = (snapshot[0] as any).odds_at_placement;
      const result = placeEachWayBet(stake, selOdds, ewFraction);
      potentialWin = result.potentialWin;
      totalStake = result.totalStake;
      metadata = {
        ew_fraction: ewFraction,
        ew_places: ewPlaces || 3,
        win_odds: result.winOdds,
        place_odds: result.placeOdds,
        win_stake: result.winStake,
        place_stake: result.placeStake,
      };
      break;
    }

    case 'asian_handicap': {
      if (selections.length !== 1) throw new Error('AH_ONE_SELECTION');
      if (handicapLine === undefined) throw new Error('AH_LINE_REQUIRED');
      potentialWin = +(stake * totalOdds).toFixed(2);
      totalStake = stake;
      metadata = { handicap_line: handicapLine, is_quarter_line: isQuarterLine(handicapLine) };
      break;
    }

    case 'over_under': {
      if (selections.length !== 1) throw new Error('OU_ONE_SELECTION');
      if (totalLine === undefined) throw new Error('OU_LINE_REQUIRED');
      potentialWin = +(stake * totalOdds).toFixed(2);
      totalStake = stake;
      metadata = { total_line: totalLine };
      break;
    }

    default:
      throw new Error(`UNSUPPORTED_TYPE:${type}`);
  }

  const result = await db.transaction(async (trx) => {
    const account = await trx('credit_accounts')
      .where({ user_id: userId })
      .forUpdate()
      .first();

    if (!account || Number(account.balance) < totalStake) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    await trx('credit_accounts')
      .where({ user_id: userId })
      .decrement('balance', totalStake);

    const betUid = `BET-${uuidv4().slice(0, 8).toUpperCase()}`;

    const [bet] = await trx('bets').insert({
      bet_uid: betUid,
      user_id: userId,
      type,
      status: 'open',
      stake: totalStake,
      potential_win: potentialWin,
      odds_snapshot: JSON.stringify(snapshot),
      selections: JSON.stringify(selections),
      metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
    }).returning('*');

    await trx('credit_transactions').insert({
      from_user_id: userId,
      to_user_id: userId,
      amount: totalStake,
      type: 'deduct',
      note: `Bet placed: ${betUid}`,
    });

    return bet;
  });

  await writeSystemLog({
    user_id: userId,
    role: 'member',
    action: 'bet.place',
    ip_address: ip,
    user_agent: userAgent,
    payload: { bet_uid: result.bet_uid, type, stake: totalStake, potential_win: potentialWin, selections_count: selections.length, ...metadata },
    result: 'success',
  });
  const account = await db('credit_accounts').where({ user_id: userId }).first();
  emitToUser(userId, 'balance:updated', { reason: 'bet.placed', balance: account?.balance || 0 });

  return {
    bet_uid: result.bet_uid,
    type: result.type,
    stake: totalStake,
    potential_win: potentialWin,
    selections: snapshot,
    status: 'open',
    ...metadata,
  };
}

export async function getUserBetStats(userId: number) {
  const row = await db('bets')
    .where({ user_id: userId })
    .select(
      db.raw('COUNT(*)::int AS total_bets'),
      db.raw("COUNT(*) FILTER (WHERE status = 'won')::int AS won"),
      db.raw("COUNT(*) FILTER (WHERE status = 'lost')::int AS lost"),
      db.raw("COUNT(*) FILTER (WHERE status = 'open')::int AS open"),
      db.raw('COALESCE(MAX(actual_win), 0)::numeric AS biggest_win'),
      db.raw("COALESCE(SUM(CASE WHEN status = 'won' THEN actual_win ELSE 0 END) - SUM(CASE WHEN status IN ('lost','cashout') THEN stake ELSE 0 END), 0)::numeric AS total_pnl"),
    )
    .first();

  const totalBets = row?.total_bets || 0;
  const won = row?.won || 0;
  const winRate = totalBets > 0 ? +((won / totalBets) * 100).toFixed(1) : 0;

  const dailyRows = await db('bets')
    .where({ user_id: userId })
    .whereRaw("created_at >= NOW() - INTERVAL '7 days'")
    .select(
      db.raw('DATE(created_at) AS day'),
      db.raw("COALESCE(SUM(CASE WHEN status = 'won' THEN actual_win ELSE 0 END) - SUM(CASE WHEN status IN ('lost','cashout') THEN stake ELSE 0 END), 0)::numeric AS pnl"),
    )
    .groupByRaw('DATE(created_at)')
    .orderBy('day');

  return {
    totalBets,
    won,
    lost: row?.lost || 0,
    open: row?.open || 0,
    winRate,
    biggestWin: +Number(row?.biggest_win || 0).toFixed(2),
    totalPnl: +Number(row?.total_pnl || 0).toFixed(2),
    dailyPnl: dailyRows.map((r: any) => ({ day: r.day, pnl: +Number(r.pnl).toFixed(2) })),
  };
}

export async function getUserBets(userId: number, status?: string, page: number = 1, limit: number = 50) {
  let query = db('bets').where({ user_id: userId });
  if (status) query = query.where({ status });

  const total = await query.clone().count('id as count').first();
  const betsRaw = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);

  const bets = betsRaw.map((bet: any) => {
    if (bet.status !== 'open') return bet;
    return {
      ...bet,
      cashout_offer: calculateCashoutOffer(bet),
      cashout_available: true,
    };
  });

  return {
    bets,
    total: Number(total?.count || 0),
    page,
    limit,
  };
}

function calculateCashoutOffer(bet: any): number {
  const potential = Number(bet.potential_win || 0);
  const stake = Number(bet.stake || 0);
  const selections = typeof bet.selections === 'string' ? JSON.parse(bet.selections) : (bet.selections || []);
  const count = Array.isArray(selections) ? selections.length : 1;
  const typeFactor = bet.type === 'single' ? 0.86 : bet.type === 'accumulator' ? 0.72 : 0.68;
  const complexityFactor = Math.max(0.52, 1 - (count - 1) * 0.07);
  const gross = potential * typeFactor * complexityFactor;
  const floor = stake * 0.65;
  const capped = Math.min(potential * 0.92, Math.max(floor, gross));
  return +capped.toFixed(2);
}

export async function cashoutBet(userId: number, betUid: string, ip: string, userAgent: string) {
  const result = await db.transaction(async (trx) => {
    const bet = await trx('bets')
      .where({ bet_uid: betUid, user_id: userId })
      .forUpdate()
      .first();

    if (!bet) throw new Error('BET_NOT_FOUND');
    if (bet.status !== 'open') throw new Error('BET_NOT_OPEN');

    const cashoutAmount = calculateCashoutOffer(bet);

    const metadata = bet.metadata
      ? (typeof bet.metadata === 'string' ? JSON.parse(bet.metadata) : bet.metadata)
      : {};

    await trx('bets')
      .where({ id: bet.id })
      .update({
        status: 'cashout',
        actual_win: cashoutAmount,
        settled_at: db.fn.now(),
        metadata: JSON.stringify({
          ...metadata,
          cashout_offer: cashoutAmount,
          cashout_at: new Date().toISOString(),
        }),
      });

    await trx('credit_accounts')
      .where({ user_id: userId })
      .increment('balance', cashoutAmount);

    await trx('credit_transactions').insert({
      from_user_id: null,
      to_user_id: userId,
      amount: cashoutAmount,
      type: 'create',
      note: `Bet cashout: ${bet.bet_uid}`,
    });

    return {
      bet_uid: bet.bet_uid,
      cashout_amount: cashoutAmount,
      previous_potential_win: Number(bet.potential_win || 0),
    };
  });

  await writeSystemLog({
    user_id: userId,
    role: 'member',
    action: 'bet.cashout',
    ip_address: ip,
    user_agent: userAgent,
    payload: result,
    result: 'success',
  });
  const account = await db('credit_accounts').where({ user_id: userId }).first();
  emitToUser(userId, 'balance:updated', { reason: 'bet.cashout', balance: account?.balance || 0 });

  return result;
}

export async function partialCashoutBet(
  userId: number,
  betUid: string,
  percent: number,
  ip: string,
  userAgent: string
) {
  if (Number.isNaN(percent) || percent <= 0 || percent >= 100) {
    throw new Error('INVALID_CASHOUT_PERCENT');
  }

  const result = await db.transaction(async (trx) => {
    const bet = await trx('bets')
      .where({ bet_uid: betUid, user_id: userId })
      .forUpdate()
      .first();

    if (!bet) throw new Error('BET_NOT_FOUND');
    if (bet.status !== 'open') throw new Error('BET_NOT_OPEN');

    const currentStake = Number(bet.stake || 0);
    const currentPotential = Number(bet.potential_win || 0);
    if (currentStake <= 1) throw new Error('BET_NOT_ELIGIBLE_FOR_PARTIAL_CASHOUT');

    const fraction = percent / 100;
    const fullCashoutOffer = calculateCashoutOffer(bet);
    const payout = +(fullCashoutOffer * fraction).toFixed(2);
    const stakeReduction = +(currentStake * fraction).toFixed(2);
    const potentialReduction = +(currentPotential * fraction).toFixed(2);

    const newStake = +(currentStake - stakeReduction).toFixed(2);
    const newPotential = +(currentPotential - potentialReduction).toFixed(2);

    if (newStake < 1) throw new Error('BET_NOT_ELIGIBLE_FOR_PARTIAL_CASHOUT');

    const metadata = bet.metadata
      ? (typeof bet.metadata === 'string' ? JSON.parse(bet.metadata) : bet.metadata)
      : {};

    const partialCashouts = Array.isArray(metadata.partial_cashouts)
      ? metadata.partial_cashouts
      : [];
    partialCashouts.push({
      at: new Date().toISOString(),
      percent,
      payout,
      stake_reduction: stakeReduction,
      potential_reduction: potentialReduction,
    });

    await trx('bets')
      .where({ id: bet.id })
      .update({
        stake: newStake,
        potential_win: newPotential,
        metadata: JSON.stringify({
          ...metadata,
          partial_cashouts: partialCashouts,
          last_partial_cashout_offer: fullCashoutOffer,
        }),
      });

    await trx('credit_accounts')
      .where({ user_id: userId })
      .increment('balance', payout);

    await trx('credit_transactions').insert({
      from_user_id: null,
      to_user_id: userId,
      amount: payout,
      type: 'create',
      note: `Partial cashout (${percent}%): ${bet.bet_uid}`,
    });

    return {
      bet_uid: bet.bet_uid,
      partial_percent: percent,
      payout,
      remaining_stake: newStake,
      remaining_potential_win: newPotential,
    };
  });

  await writeSystemLog({
    user_id: userId,
    role: 'member',
    action: 'bet.partial_cashout',
    ip_address: ip,
    user_agent: userAgent,
    payload: result,
    result: 'success',
  });
  const account = await db('credit_accounts').where({ user_id: userId }).first();
  emitToUser(userId, 'balance:updated', { reason: 'bet.partial_cashout', balance: account?.balance || 0 });

  return result;
}
