const SPORT_ROUTE_MAP: Record<string, string> = {
  football: '/sports/football',
  soccer: '/sports/football',
  tennis: '/sports/tennis',
  basketball: '/sports/basketball',
  golf: '/sports/golf',
  esports: '/sports/esports',
  cricket: '/sports/cricket',
  horse_racing: '/sports/horse-racing',
  horseracing: '/sports/horse-racing',
  ice_hockey: '/sports/ice-hockey',
  hockey: '/sports/ice-hockey',
  baseball: '/sports/baseball',
  rugby: '/sports/rugby',
  handball: '/sports/handball',
  volleyball: '/sports/volleyball',
};

export function resolveEventHref(event: { id: string | number; sport?: string }): string {
  const sport = (event.sport || 'football').toLowerCase().replace(/\s+/g, '_');
  const base = SPORT_ROUTE_MAP[sport] || `/sports/${sport}`;
  return `${base}/${event.id}`;
}

export function getSportIcon(sport: string): string {
  const icons: Record<string, string> = {
    football: '\u26BD',
    soccer: '\u26BD',
    tennis: '\uD83C\uDFBE',
    basketball: '\uD83C\uDFC0',
    golf: '\u26F3',
    esports: '\uD83C\uDFAE',
    cricket: '\uD83C\uDFCF',
    horse_racing: '\uD83C\uDFC7',
    ice_hockey: '\uD83C\uDFD2',
    baseball: '\u26BE',
    rugby: '\uD83C\uDFC9',
    handball: '\uD83E\uDD3E',
    volleyball: '\uD83C\uDFD0',
  };
  return icons[sport.toLowerCase()] || '\u26BD';
}
