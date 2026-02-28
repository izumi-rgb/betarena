interface LobbyGame {
  id: string;
  title: string;
  provider: string;
  category: 'slots' | 'live-casino' | 'virtual' | 'esports';
  badge?: 'new' | 'hot' | 'exclusive';
  rtp?: string;
}

interface PromoCard {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  color: string;
}

interface RaceMarket {
  id: string;
  name: string;
  odds: number;
}

interface RaceEvent {
  id: string;
  meeting: string;
  raceName: string;
  startTime: string;
  markets: RaceMarket[];
}

const LOBBY_GAMES: LobbyGame[] = [
  { id: 'g1', title: 'Mega Wheel', provider: 'Evolution', category: 'live-casino', badge: 'hot' },
  { id: 'g2', title: 'Lightning Roulette', provider: 'Evolution', category: 'live-casino', badge: 'exclusive' },
  { id: 'g3', title: 'Book of Kingdoms', provider: 'Pragmatic Play', category: 'slots', badge: 'new', rtp: '96.5%' },
  { id: 'g4', title: 'Golden Goals', provider: 'BetArena Studio', category: 'virtual', badge: 'hot' },
  { id: 'g5', title: 'eSoccer GT Leagues', provider: 'Betradar', category: 'esports' },
  { id: 'g6', title: 'Aviator', provider: 'Spribe', category: 'slots', badge: 'hot' },
  { id: 'g7', title: 'Mega Fire Blaze', provider: 'Pragmatic Play', category: 'slots', rtp: '96.2%' },
  { id: 'g8', title: 'Live Blackjack A', provider: 'Evolution', category: 'live-casino' },
  { id: 'g9', title: 'Virtual Tennis Cup', provider: 'BetArena Studio', category: 'virtual' },
  { id: 'g10', title: 'Counter-Strike Match Winner', provider: 'OddsMatrix', category: 'esports' },
];

const PROMOTIONS: PromoCard[] = [
  {
    id: 'p1',
    title: 'Bet Boosts',
    subtitle: 'Daily enhanced odds across football, tennis and NBA.',
    cta: 'View boosts',
    color: 'from-emerald-700 via-emerald-600 to-emerald-800',
  },
  {
    id: 'p2',
    title: 'Same Game Parlay+',
    subtitle: 'Build your own in-play combos with instant payout preview.',
    cta: 'Build a parlay',
    color: 'from-cyan-700 via-cyan-600 to-teal-800',
  },
  {
    id: 'p3',
    title: 'Live Casino Cashback',
    subtitle: '5% cashback every Monday on selected live tables.',
    cta: 'Open live casino',
    color: 'from-amber-700 via-yellow-600 to-lime-700',
  },
];

const RACECARDS: RaceEvent[] = [
  {
    id: 'r1',
    meeting: 'Cheltenham',
    raceName: '2m Handicap Hurdle',
    startTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    markets: [
      { id: 'm1', name: 'Fleet Commander', odds: 4.1 },
      { id: 'm2', name: 'Blue Harbor', odds: 5.8 },
      { id: 'm3', name: 'Lady Winter', odds: 8.0 },
    ],
  },
  {
    id: 'r2',
    meeting: 'Meydan',
    raceName: '5f Sprint Stakes',
    startTime: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
    markets: [
      { id: 'm1', name: 'Night Falcon', odds: 3.9 },
      { id: 'm2', name: 'Bravo One', odds: 6.2 },
      { id: 'm3', name: 'Speed Avenue', odds: 7.4 },
    ],
  },
  {
    id: 'r3',
    meeting: 'Romford',
    raceName: 'Greyhound 575m',
    startTime: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    markets: [
      { id: 'm1', name: 'Trap 1', odds: 2.9 },
      { id: 'm2', name: 'Trap 3', odds: 4.3 },
      { id: 'm3', name: 'Trap 5', odds: 5.2 },
    ],
  },
];

export function getGamingLobby() {
  const byCategory = LOBBY_GAMES.reduce<Record<string, LobbyGame[]>>((acc, game) => {
    if (!acc[game.category]) acc[game.category] = [];
    acc[game.category].push(game);
    return acc;
  }, {});

  return {
    categories: Object.entries(byCategory).map(([key, games]) => ({
      key,
      title: key === 'live-casino'
        ? 'Live Casino'
        : key === 'virtual'
          ? 'Virtual Sports'
          : key === 'esports'
            ? 'Esports'
            : 'Slots',
      games,
    })),
    featured: LOBBY_GAMES.filter((g) => g.badge === 'hot' || g.badge === 'exclusive').slice(0, 6),
  };
}

export function getPromotions() {
  return PROMOTIONS;
}

export function getRacecards() {
  return RACECARDS;
}

export function getVirtualSportsFeed() {
  return [
    {
      id: 'v1',
      league: 'Virtual Football Premier',
      fixture: 'Northbridge vs Westport',
      kickOff: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      markets: [
        { id: '1', name: 'Home', odds: 2.35 },
        { id: 'x', name: 'Draw', odds: 3.4 },
        { id: '2', name: 'Away', odds: 2.85 },
      ],
    },
    {
      id: 'v2',
      league: 'Virtual Basketball Pro',
      fixture: 'Lions vs Hawks',
      kickOff: new Date(Date.now() + 9 * 60 * 1000).toISOString(),
      markets: [
        { id: 'h', name: 'Lions', odds: 1.92 },
        { id: 'a', name: 'Hawks', odds: 1.92 },
      ],
    },
    {
      id: 'v3',
      league: 'Virtual Greyhounds',
      fixture: 'Race 8 - 480m',
      kickOff: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      markets: [
        { id: '1', name: 'Trap 1', odds: 3.2 },
        { id: '2', name: 'Trap 2', odds: 4.1 },
        { id: '3', name: 'Trap 3', odds: 5.8 },
      ],
    },
  ];
}
