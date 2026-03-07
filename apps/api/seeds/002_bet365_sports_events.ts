import { Knex } from 'knex';

/** bet365-style sports and sample events for dev/demo. Run after 001_admin_user. */
const SPORTS_LEAGUES: Array<{ sport: string; league: string; home: string; away: string; externalId: string }> = [
  { sport: 'Football', league: 'Champions League', home: 'Real Madrid', away: 'Manchester City', externalId: 'seed-fb-1' },
  { sport: 'Football', league: 'Premier League', home: 'Liverpool', away: 'Arsenal', externalId: 'seed-fb-2' },
  { sport: 'Football', league: 'La Liga', home: 'Barcelona', away: 'Atletico Madrid', externalId: 'seed-fb-3' },
  { sport: 'Tennis', league: 'ATP Masters', home: 'Djokovic', away: 'Sinner', externalId: 'seed-tn-1' },
  { sport: 'Tennis', league: 'WTA', home: 'Swiatek', away: 'Sabalenka', externalId: 'seed-tn-2' },
  { sport: 'Basketball', league: 'NBA', home: 'Lakers', away: 'Celtics', externalId: 'seed-bb-1' },
  { sport: 'Basketball', league: 'NBA', home: 'Warriors', away: 'Bucks', externalId: 'seed-bb-2' },
  { sport: 'Ice Hockey', league: 'NHL', home: 'Maple Leafs', away: 'Bruins', externalId: 'seed-ih-1' },
  { sport: 'American Football', league: 'NFL', home: 'Chiefs', away: '49ers', externalId: 'seed-af-1' },
  { sport: 'Cricket', league: 'ICC', home: 'India', away: 'Australia', externalId: 'seed-cr-1' },
  { sport: 'Baseball', league: 'MLB', home: 'Yankees', away: 'Dodgers', externalId: 'seed-bs-1' },
];

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export async function seed(knex: Knex): Promise<void> {
  const seedEventIds = await knex('events').where('external_id', 'like', 'seed-%').pluck('id');
  if (seedEventIds.length > 0) {
    await knex('odds').whereIn('event_id', seedEventIds).delete();
    await knex('events').whereIn('id', seedEventIds).delete();
  }

  const now = new Date();
  const events: Array<{
    external_id: string;
    sport: string;
    league: string;
    home_team: string;
    away_team: string;
    starts_at: Date;
    status: string;
  }> = SPORTS_LEAGUES.map((g, i) => ({
    external_id: g.externalId,
    sport: g.sport,
    league: g.league,
    home_team: g.home,
    away_team: g.away,
    starts_at: addDays(now, Math.floor(i / 3)),
    status: 'scheduled',
  }));

  const inserted = await knex('events').insert(events).returning('*');

  const matchResultSelections = [
    { name: 'Home', odds: 2.1 },
    { name: 'Draw', odds: 3.4 },
    { name: 'Away', odds: 3.2 },
  ];
  const bttsSelections = [
    { name: 'Yes', odds: 1.85 },
    { name: 'No', odds: 1.95 },
  ];
  const correctScoreSelections = [
    { name: '1-0', odds: 7.0 },
    { name: '0-0', odds: 9.0 },
    { name: '2-1', odds: 8.5 },
  ];
  const overUnderSelections = [
    { name: 'Over 2.5', line: '2.5', odds: 1.91 },
    { name: 'Under 2.5', line: '2.5', odds: 1.95 },
  ];
  const asianHandicapSelections = [
    { name: 'Home -0.5', line: '-0.5', odds: 2.05 },
    { name: 'Away +0.5', line: '+0.5', odds: 1.83 },
  ];
  const doubleChanceSelections = [
    { name: '1X', odds: 1.38 },
    { name: '12', odds: 1.32 },
    { name: 'X2', odds: 1.61 },
  ];
  const drawNoBetSelections = [
    { name: 'Home', odds: 1.62 },
    { name: 'Away', odds: 2.2 },
  ];
  const teamTotalHomeSelections = [
    { name: 'Over 1.5', line: '1.5', odds: 2.05 },
    { name: 'Under 1.5', line: '1.5', odds: 1.78 },
  ];
  const teamTotalAwaySelections = [
    { name: 'Over 1.5', line: '1.5', odds: 2.25 },
    { name: 'Under 1.5', line: '1.5', odds: 1.65 },
  ];
  const cornersTotalSelections = [
    { name: 'Over 9.5', line: '9.5', odds: 1.9 },
    { name: 'Under 9.5', line: '9.5', odds: 1.92 },
  ];
  const cornersHandicapSelections = [
    { name: 'Home -1.5', line: '-1.5', odds: 2.1 },
    { name: 'Away +1.5', line: '+1.5', odds: 1.72 },
  ];
  const cardsTotalSelections = [
    { name: 'Over 4.5', line: '4.5', odds: 1.88 },
    { name: 'Under 4.5', line: '4.5', odds: 1.94 },
  ];
  const playerShotsSelections = [
    { name: 'Home Star 2+ SOT', odds: 2.45 },
    { name: 'Away Star 2+ SOT', odds: 2.72 },
    { name: 'Home Star 3+ SOT', odds: 4.8 },
  ];
  const playerToScoreSelections = [
    { name: 'Home Striker', odds: 2.35 },
    { name: 'Away Striker', odds: 2.8 },
    { name: 'Anytime Midfielder', odds: 3.9 },
  ];

  const basketballTotalSelections = [
    { name: 'Over 214.5', line: '214.5', odds: 1.91 },
    { name: 'Under 214.5', line: '214.5', odds: 1.91 },
  ];
  const basketballHandicapSelections = [
    { name: 'Home -4.5', line: '-4.5', odds: 1.95 },
    { name: 'Away +4.5', line: '+4.5', odds: 1.87 },
  ];

  const tennisTotalSelections = [
    { name: 'Over 22.5', line: '22.5', odds: 1.95 },
    { name: 'Under 22.5', line: '22.5', odds: 1.85 },
  ];
  const tennisHandicapSelections = [
    { name: 'Home -2.5 Games', line: '-2.5', odds: 1.9 },
    { name: 'Away +2.5 Games', line: '+2.5', odds: 1.9 },
  ];

  const oddsRows: Array<{ event_id: number; market_type: string; selections: string; is_live: boolean }> = [];
  for (const ev of inserted) {
    const isLive = ev.status === 'live';
    oddsRows.push({
      event_id: ev.id,
      market_type: 'match_result',
      selections: JSON.stringify(matchResultSelections),
      is_live: isLive,
    });

    if (ev.sport === 'Football') {
      oddsRows.push(
        { event_id: ev.id, market_type: 'btts', selections: JSON.stringify(bttsSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'correct_score', selections: JSON.stringify(correctScoreSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'over_under', selections: JSON.stringify(overUnderSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'asian_handicap', selections: JSON.stringify(asianHandicapSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'double_chance', selections: JSON.stringify(doubleChanceSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'draw_no_bet', selections: JSON.stringify(drawNoBetSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'team_total_home', selections: JSON.stringify(teamTotalHomeSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'team_total_away', selections: JSON.stringify(teamTotalAwaySelections), is_live: isLive },
        { event_id: ev.id, market_type: 'corners_total', selections: JSON.stringify(cornersTotalSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'corners_handicap', selections: JSON.stringify(cornersHandicapSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'cards_total', selections: JSON.stringify(cardsTotalSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'player_shots_on_target', selections: JSON.stringify(playerShotsSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'player_to_score', selections: JSON.stringify(playerToScoreSelections), is_live: isLive },
      );
      continue;
    }

    if (ev.sport === 'Basketball') {
      oddsRows.push(
        { event_id: ev.id, market_type: 'over_under', selections: JSON.stringify(basketballTotalSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'asian_handicap', selections: JSON.stringify(basketballHandicapSelections), is_live: isLive },
      );
      continue;
    }

    if (ev.sport === 'Tennis') {
      oddsRows.push(
        { event_id: ev.id, market_type: 'over_under', selections: JSON.stringify(tennisTotalSelections), is_live: isLive },
        { event_id: ev.id, market_type: 'asian_handicap', selections: JSON.stringify(tennisHandicapSelections), is_live: isLive },
      );
      continue;
    }

    oddsRows.push(
      { event_id: ev.id, market_type: 'over_under', selections: JSON.stringify(overUnderSelections), is_live: isLive },
      { event_id: ev.id, market_type: 'asian_handicap', selections: JSON.stringify(asianHandicapSelections), is_live: isLive },
    );
  }
  await knex('odds').insert(oddsRows);

  console.log(`Seeded ${inserted.length} bet365-style events across ${new Set(events.map((e) => e.sport)).size} sports.`);
}
