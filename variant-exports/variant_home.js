import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Link, useLocation, useNavigate } from 'react-router-dom';
import { useCredits } from '@/contexts/CreditsContext';
import { apiGet } from '@/lib/api';

const customStyles = {
  appLayout: {
    display: 'grid',
    gridTemplateRows: '64px 1fr',
    gridTemplateColumns: '240px 1fr 320px',
    height: '100vh',
    background: 'radial-gradient(circle at top center, #1a2235 0%, #0B0E1A 60%)',
  },
  header: {
    gridColumn: '1 / -1',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #1E293B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 50,
  },
  sidebar: {
    backgroundColor: '#111827',
    borderRight: '1px solid #1E293B',
    overflowY: 'auto',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  mainContent: {
    overflowY: 'auto',
    padding: '24px 32px',
  },
  betslip: {
    backgroundColor: '#111827',
    borderLeft: '1px solid #1E293B',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 40,
  },
  brand: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#F1F5F9',
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'Inter, sans-serif',
  },
  liveCard: {
    background: 'rgba(26, 34, 53, 0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #1E293B',
    borderRadius: '12px',
    padding: '16px',
    position: 'relative',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  oddsBtn: {
    background: '#1E2D45',
    borderRadius: '6px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    flex: 1,
  },
  oddsBtnSelected: {
    background: '#00C37B',
    borderRadius: '6px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    flex: 1,
  },
  oddsCellBtn: {
    background: '#0B0E1A',
    width: '60px',
    height: '36px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Roboto Mono, monospace',
    fontWeight: 700,
    color: '#00C37B',
    cursor: 'pointer',
    transition: 'all 0.1s',
    fontSize: '14px',
  },
  placeBetBtn: {
    width: '100%',
    background: '#00C37B',
    color: '#000',
    border: 'none',
    padding: '14px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'transform 0.1s, filter 0.2s',
    fontFamily: 'Inter, sans-serif',
  },
  stakeInput: {
    background: '#0B0E1A',
    border: '1px solid #1E293B',
    color: '#F1F5F9',
    padding: '10px',
    borderRadius: '6px',
    width: '100%',
    fontFamily: 'Roboto Mono, monospace',
    textAlign: 'right',
    fontSize: '14px',
    outline: 'none',
  },
  subNav: {
    marginLeft: '28px',
    marginTop: '4px',
    borderLeft: '1px solid #1E293B',
    paddingLeft: '12px',
  },
  selectionCard: {
    background: '#1A2235',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px',
    border: '1px solid #1E293B',
    position: 'relative',
  },
  leagueTable: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 4px',
  },
};

const pulseKeyframes = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes flashGreen {
    0% { background-color: rgba(0, 195, 123, 0.5); }
    100% { background-color: #0B0E1A; }
  }
  @keyframes flashRed {
    0% { background-color: rgba(239, 68, 68, 0.5); }
    100% { background-color: #0B0E1A; }
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0B0E1A; }
  ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #64748B; }
  body { overflow: hidden; }
`;

const LiveDot = () => (
  <div style={{
    width: '6px',
    height: '6px',
    background: '#EF4444',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite',
    display: 'inline-block',
  }} />
);

const OddsButton = ({ label, value, selected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const baseStyle = selected ? customStyles.oddsBtnSelected : {
    ...customStyles.oddsBtn,
    background: hovered ? '#2d3b55' : '#1E2D45',
  };

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        fontSize: '10px',
        color: selected ? '#000' : '#64748B',
        marginBottom: '2px',
      }}>{label}</div>
      <div style={{
        fontFamily: 'Roboto Mono, monospace',
        fontWeight: 700,
        color: selected ? '#000' : '#F59E0B',
        fontSize: '13px',
      }}>{value}</div>
    </div>
  );
};

const OddsCellButton = ({ value, flash, selected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        ...customStyles.oddsCellBtn,
        background: selected ? '#00C37B' : (hovered ? '#2d3b55' : '#0B0E1A'),
        color: selected ? '#000' : (hovered ? '#F1F5F9' : '#00C37B'),
        fontWeight: selected ? 700 : undefined,
        animation: flash ? `${flash} 0.5s` : 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {value}
    </div>
  );
};

const LiveCard = ({ league, status, team1, score1, team2, score2, odds, selectedOdds, onOddsClick, markets, detailHref }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...customStyles.liveCard,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.15)' : 'none',
        borderColor: hovered ? 'rgba(255,255,255,0.1)' : '#1E293B',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '12px', color: '#94A3B8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px' }}>
          <LiveDot /> LIVE • {status}
        </div>
        <div>{league}</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600, fontSize: '15px' }}>
          <span>{team1}</span>
          <span style={{ color: '#00C37B', fontFamily: 'Roboto Mono, monospace' }}>{score1}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '15px' }}>
          <span>{team2}</span>
          <span style={{ color: '#00C37B', fontFamily: 'Roboto Mono, monospace' }}>{score2}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${odds.length}, 1fr)`, gap: '8px' }}>
        {odds.map((odd, i) => (
          <OddsButton
            key={i}
            label={odd.label}
            value={odd.value}
            selected={selectedOdds === i}
            onClick={() => onOddsClick(i)}
          />
        ))}
      </div>
      <div style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#94A3B8' }}>
        <Link to={detailHref} style={{ color: '#94A3B8', textDecoration: 'none' }}>+{markets} Markets</Link>
      </div>
    </div>
  );
};

const NavLink = ({ children, active, badge, onClick, style }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: '6px',
        color: active ? '#F1F5F9' : (hovered ? '#F1F5F9' : '#94A3B8'),
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '2px',
        background: active ? '#1E2D45' : (hovered ? '#1A2235' : 'transparent'),
        borderLeft: active ? '3px solid #00C37B' : '3px solid transparent',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {children}
      </div>
      {badge !== undefined && (
        <span style={{
          fontSize: '11px',
          background: 'rgba(255,255,255,0.05)',
          padding: '2px 6px',
          borderRadius: '4px',
          color: active ? '#F1F5F9' : '#64748B',
        }}>{badge}</span>
      )}
    </div>
  );
};

const FilterPill = ({ label, active, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? '#00C37B' : '#1A2235',
        border: `1px solid ${active ? '#00C37B' : (hovered ? '#94A3B8' : '#1E293B')}`,
        padding: '8px 16px',
        borderRadius: '20px',
        color: active ? '#000' : (hovered ? '#F1F5F9' : '#94A3B8'),
        fontSize: '13px',
        fontWeight: active ? 600 : 500,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </div>
  );
};

const UPCOMING_LABELS = ['1', 'X', '2'];

const UpcomingRow = ({ match, idx, favorites, toggleFavorite, selectedOdds, setSelectedOdds, addToSlip, removeFromSlip }) => {
  const [rowHovered, setRowHovered] = useState(false);
  const rowKey = `upcoming-${idx}`;
  return (
    <tr
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
      style={{ background: rowHovered ? '#232d42' : '#1A2235' }}
    >
      <td style={{ padding: '12px 16px', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}>
        <div style={{ color: '#94A3B8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            onClick={() => toggleFavorite(rowKey)}
            style={{ color: favorites[rowKey] ? '#F59E0B' : '#64748B', cursor: 'pointer' }}
          >★</span>
          {match.time}
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontWeight: 500, color: '#F1F5F9' }}>
          <div>{match.team1}</div>
          <div style={{ marginTop: '2px', fontSize: '12px', color: '#94A3B8' }}>{match.team2}</div>
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {match.odds.map((odd, oi) => {
            if (odd === '—') return <OddsCellButton key={oi} value={odd} flash={null} />;
            const selKey = `${rowKey}-${oi}`;
            const isSelected = selectedOdds?.[rowKey] === oi;
            return (
              <OddsCellButton
                key={oi}
                value={odd}
                flash={match.flash[oi]}
                selected={isSelected}
                onClick={() => {
                  const wasSelected = isSelected;
                  setSelectedOdds(prev => ({ ...prev, [rowKey]: wasSelected ? null : oi }));
                  if (wasSelected) {
                    removeFromSlip(selKey);
                  } else {
                    if (selectedOdds?.[rowKey] != null) removeFromSlip(`${rowKey}-${selectedOdds[rowKey]}`);
                    const label = UPCOMING_LABELS[oi] || String(oi + 1);
                    addToSlip(`${match.team1} vs ${match.team2}`, 'Match Result', label === '1' ? match.team1 : label === '2' ? match.team2 : 'Draw', odd, selKey);
                  }
                }}
              />
            );
          })}
        </div>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right', paddingRight: '24px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}>
        <Link to={match.detailHref} style={{ color: '#94A3B8', fontSize: '12px', textDecoration: 'none' }}>+{match.markets}</Link>
      </td>
    </tr>
  );
};

const SlipTab = ({ label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      fontSize: '13px',
      fontWeight: 600,
      color: active ? '#F1F5F9' : '#94A3B8',
      cursor: 'pointer',
      paddingBottom: '4px',
      borderBottom: active ? '2px solid #00C37B' : '2px solid transparent',
    }}
  >
    {label}
  </div>
);

const QuickStakeBtn = ({ label, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: hovered ? '#232d42' : '#0B0E1A',
        border: '1px solid #1E293B',
        color: hovered ? '#F1F5F9' : '#94A3B8',
        padding: '6px',
        fontSize: '12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {label}
    </button>
  );
};

const App = () => {
  const [activeNav, setActiveNav] = useState('Sports');
  const [activeSideNav, setActiveSideNav] = useState('In-Play');
  const [activeFilter, setActiveFilter] = useState('All Sports');
  const [activeSlipTab, setActiveSlipTab] = useState('Singles');
  const [selectedOdds, setSelectedOdds] = useState({});
  const [stake, setStake] = useState('50.00');
  const [betPlaced, setBetPlaced] = useState(false);
  const [betError, setBetError] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [slipSelections, setSlipSelections] = useState([]);
  const [liveApiEvents, setLiveApiEvents] = useState(null);
  const [sportCounts, setSportCounts] = useState({});
  const navigate = useNavigate();
  const { balance, isLoading: balanceLoading, formatBalance, placeBet: apiPlaceBet, isAuthenticated } = useCredits();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = pulseKeyframes + `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap');
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const res = await apiGet('/api/sports/live');
        if (!cancelled && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLiveApiEvents(res.data);
        }
      } catch (_) {
        // keep fallback data on error
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 30000);

    apiGet('/api/sports/counts').then(res => {
      if (!cancelled && res.success && res.data) setSportCounts(res.data);
    }).catch(() => {});

    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const FALLBACK_LIVE = [
    {
      id: 0, sport: 'Football',
      league: 'Premier League', status: "74'",
      team1: 'Arsenal', score1: '2', team2: 'Chelsea', score2: '1',
      detailHref: '/sports/football/seed-fb-0', odds: [{ label: '1', value: '1.25' }, { label: 'X', value: '4.50' }, { label: '2', value: '8.00' }], markets: 112,
    },
    {
      id: 1, sport: 'Basketball',
      league: 'NBA', status: '3rd Qtr',
      team1: 'Lakers', score1: '88', team2: 'Warriors', score2: '92',
      detailHref: '/sports/basketball/seed-bb-1', odds: [{ label: '1', value: '2.85' }, { label: '2', value: '1.45' }], markets: 45,
    },
    {
      id: 2, sport: 'Tennis',
      league: 'ATP Dubai', status: '2nd Set',
      team1: 'Djokovic', score1: '1', team2: 'Alcaraz', score2: '0',
      detailHref: '/sports/tennis/seed-tn-2', odds: [{ label: '1', value: '1.18' }, { label: '2', value: '4.20' }], markets: 12,
    },
    {
      id: 3, sport: 'Football',
      league: 'La Liga', status: "38'",
      team1: 'Barcelona', score1: '1', team2: 'Real Madrid', score2: '1',
      detailHref: '/sports/football/seed-fb-3', odds: [{ label: '1', value: '2.10' }, { label: 'X', value: '3.25' }, { label: '2', value: '3.40' }], markets: 98,
    },
    {
      id: 4, sport: 'Esports',
      league: 'LEC Spring', status: 'Game 2',
      team1: 'G2 Esports', score1: '1', team2: 'Fnatic', score2: '0',
      detailHref: '/sports/esports/seed-es-4', odds: [{ label: '1', value: '1.60' }, { label: '2', value: '2.25' }], markets: 18,
    },
    {
      id: 5, sport: 'Cricket',
      league: 'IPL', status: '32nd Over',
      team1: 'Mumbai Indians', score1: '198', team2: 'Chennai SK', score2: '—',
      detailHref: '/sports/cricket/seed-cr-5', odds: [{ label: '1', value: '1.55' }, { label: '2', value: '2.40' }], markets: 22,
    },
    {
      id: 6, sport: 'Tennis',
      league: 'WTA Dubai', status: '1st Set',
      team1: 'Swiatek', score1: '3', team2: 'Sabalenka', score2: '2',
      detailHref: '/sports/tennis/seed-tn-6', odds: [{ label: '1', value: '1.72' }, { label: '2', value: '2.10' }], markets: 8,
    },
  ];

  const mapApiEvent = (event, index) => {
    const sportRaw = event.sport || '';
    const sport = sportRaw.charAt(0).toUpperCase() + sportRaw.slice(1);
    const league = event.competition?.name || event.league || sport;
    const status = event.clock || event.status || '';
    const team1 = event.homeTeam?.name || 'Home';
    const team2 = event.awayTeam?.name || 'Away';
    const score1 = event.score != null ? String(event.score.home ?? 0) : String(event.homeScore ?? 0);
    const score2 = event.score != null ? String(event.score.away ?? 0) : String(event.awayScore ?? 0);
    const sportLower = sportRaw.toLowerCase();

    let odds = [];
    const mkts = event.markets || [];
    const mainMarket = mkts.find(m =>
      ['h2h', 'match_result', '1x2', 'moneyline', 'winner', 'match_winner'].includes((m.id || m.type || '').toLowerCase())
    ) || mkts[0];

    if (mainMarket?.selections?.length) {
      odds = mainMarket.selections.map((sel) => ({
        label: sel.name === 'Home' ? '1' : sel.name === 'Away' ? '2' : sel.name === 'Draw' ? 'X' : sel.name,
        value: typeof sel.odds === 'number' ? sel.odds.toFixed(2) : String(sel.odds || '—'),
      }));
    } else {
      odds = sportLower === 'football'
        ? [{ label: '1', value: '—' }, { label: 'X', value: '—' }, { label: '2', value: '—' }]
        : [{ label: '1', value: '—' }, { label: '2', value: '—' }];
    }

    const hrefMap = { football: '/sports/football', basketball: '/sports/basketball', tennis: '/sports/tennis', cricket: '/sports/cricket', esports: '/sports/esports', golf: '/sports/golf' };

    return {
      id: event.id || index,
      sport,
      league,
      status,
      team1, score1, team2, score2,
      odds,
      markets: mkts.length || 1,
      detailHref: `${hrefMap[sportLower] || '/sports'}/${event.id || index}`,
    };
  };

  const liveMatches = liveApiEvents
    ? liveApiEvents.map(mapApiEvent)
    : FALLBACK_LIVE;

  const upcomingMatches = [
    { sport: 'Football', time: '20:00', team1: 'Man City', team2: 'Liverpool', odds: ['1.95', '3.60', '3.80'], markets: 140, flash: [null, null, null], detailHref: '/sports' },
    { sport: 'Football', time: '14:30', team1: 'Man Utd', team2: 'Tottenham', odds: ['2.40', '3.40', '2.90'], markets: 128, flash: ['up', null, 'down'], detailHref: '/sports' },
    { sport: 'Football', time: '17:00', team1: 'Aston Villa', team2: 'Everton', odds: ['1.75', '3.90', '4.50'], markets: 105, flash: [null, null, null], detailHref: '/sports' },
    { sport: 'Basketball', time: '21:00', team1: 'Celtics', team2: 'Bucks', odds: ['1.80', '—', '2.00'], markets: 52, flash: [null, null, null], detailHref: '/sports/basketball' },
    { sport: 'Tennis', time: '15:00', team1: 'Sinner', team2: 'Medvedev', odds: ['1.45', '—', '2.75'], markets: 14, flash: [null, null, null], detailHref: '/sports/tennis' },
    { sport: 'Esports', time: '18:00', team1: 'T1', team2: 'Gen.G', odds: ['1.90', '—', '1.90'], markets: 10, flash: [null, null, null], detailHref: '/sports' },
    { sport: 'Cricket', time: '10:00', team1: 'India', team2: 'Australia', odds: ['1.65', '—', '2.20'], markets: 30, flash: ['up', null, null], detailHref: '/sports' },
  ];

  const filterSportName = (f) => f.replace(/\s*\(.*\)/, '');
  const filterCounts = {};
  [...liveMatches, ...upcomingMatches].forEach(m => {
    if (m.sport) filterCounts[m.sport] = (filterCounts[m.sport] || 0) + 1;
  });
  const filters = ['All Sports', ...Object.entries(filterCounts).map(([s, c]) => `${s} (${c})`)];

  const filteredLive = useMemo(() => {
    const sport = filterSportName(activeFilter);
    if (sport === 'All Sports') return liveMatches;
    return liveMatches.filter(m => m.sport === sport);
  }, [activeFilter, liveMatches]);

  const filteredUpcoming = useMemo(() => {
    const sport = filterSportName(activeFilter);
    if (sport === 'All Sports') return upcomingMatches;
    return upcomingMatches.filter(m => m.sport === sport);
  }, [activeFilter]);

  const upcomingTitle = useMemo(() => {
    const sport = filterSportName(activeFilter);
    if (sport === 'All Sports') return 'Upcoming Today';
    return sport === 'Football' ? 'Upcoming Today' : sport;
  }, [activeFilter]);
  const navTabsWithHref = [
    { label: 'Home', href: '/sports' },
    { label: 'In-Play', href: '/in-play' },
    { label: 'Results', href: '/results' },
    { label: 'My Bets', href: '/my-bets' },
    { label: 'Account', href: '/account' },
  ];
  const { pathname } = useLocation();

  const stakeNum = parseFloat(stake) || 0;
  const totalOdds = slipSelections.length > 0
    ? slipSelections.reduce((acc, s) => acc * parseFloat(s.odds), 1)
    : 1;
  const estReturn = slipSelections.length > 0
    ? (stakeNum * (activeSlipTab === 'Singles' ? (slipSelections[0] ? parseFloat(slipSelections[0].odds) : 1) : totalOdds)).toFixed(2)
    : '0.00';

  const addToSlip = (matchLabel, market, outcomeLabel, odds, selKey) => {
    setSlipSelections(prev => {
      const exists = prev.find(s => s.selKey === selKey);
      if (exists) return prev.filter(s => s.selKey !== selKey);
      return [...prev, { selKey, matchLabel, market, outcomeLabel, odds: String(odds) }];
    });
  };

  const removeFromSlip = (selKey) => {
    setSlipSelections(prev => prev.filter(s => s.selKey !== selKey));
    setSelectedOdds(prev => { const n = { ...prev }; delete n[selKey]; return n; });
  };

  const handleQuickStake = (amount) => {
    if (amount === 'MAX') {
      setStake('2450.50');
    } else {
      const num = parseFloat(stake) || 0;
      setStake((num + parseFloat(amount.replace('+', ''))).toFixed(2));
    }
  };

  const handlePlaceBet = useCallback(async () => {
    if (slipSelections.length === 0 || isPlacing) return;
    setBetError(null);

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const stakeVal = parseFloat(stake) || 0;
    if (stakeVal <= 0) { setBetError('Enter a valid stake'); return; }
    if (stakeVal > balance) { setBetError('Insufficient balance'); return; }

    setIsPlacing(true);
    try {
      const selections = slipSelections.map((sel) => ({
        event_id: sel.selKey.split('-')[1] || 1,
        market_type: sel.market || 'match_result',
        selection_name: sel.outcomeLabel,
        odds: parseFloat(sel.odds),
      }));

      const betType = slipSelections.length === 1 ? 'single' : 'accumulator';
      const result = await apiPlaceBet({ type: betType, stake: stakeVal, selections });

      if (result.success) {
        setBetPlaced(true);
        setTimeout(() => {
          setBetPlaced(false);
          setSlipSelections([]);
          setSelectedOdds({});
          setStake('50.00');
        }, 2500);
      } else {
        setBetError(result.message);
      }
    } catch (err) {
      setBetError('Something went wrong');
    } finally {
      setIsPlacing(false);
    }
  }, [slipSelections, stake, balance, isAuthenticated, isPlacing, apiPlaceBet, navigate]);

  const toggleFavorite = (key) => {
    setFavorites(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    { label: 'Home', path: 'Home' },
    { label: 'In-Play', path: 'In-Play' },
    { label: 'Results', path: 'Results' },
    { label: 'My Bets', path: 'My Bets' },
    { label: 'Account', path: 'Account' },
  ];

  return (
    <div style={{ backgroundColor: '#0B0E1A', color: '#F1F5F9', fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.5, height: '100vh', overflow: 'hidden' }}>
      <div style={customStyles.appLayout}>
        {/* Header */}
        <header style={customStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '168px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#00C37B' }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.4px', color: '#F1F5F9' }}>
              BET<span style={{ color: '#00C37B' }}>ARENA</span>
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '4px' }}>
            {navTabsWithHref.map(({ label, href }) => {
              const active = pathname === href || (href === '/sports' ? pathname.startsWith('/sports') : pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  to={href}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    color: active ? '#F1F5F9' : '#94A3B8',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: active ? '#1A2235' : 'transparent',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#F1F5F9'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; } }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: '#0B0E1A',
              border: '1px solid #1E293B',
              padding: '6px 12px',
              borderRadius: '20px',
              fontFamily: 'Roboto Mono, monospace',
              fontWeight: 700,
              color: '#00C37B',
              fontSize: '13px',
            }}>{balanceLoading ? '...' : formatBalance()}</div>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              border: '2px solid #1A2235',
            }} />
          </div>
        </header>

        {/* Sidebar */}
        <aside style={customStyles.sidebar}>
          <div style={{ padding: '0 16px' }}>
            <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '12px', paddingLeft: '8px' }}>
              Quick Links
            </div>
            {[
              {
                label: 'Sports',
                href: '/sports',
                icon: (
                  <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" />
                  </svg>
                ),
              },
              {
                label: 'In-Play',
                href: '/in-play',
                badge: 'LIVE',
                icon: (
                  <svg style={{ width: '18px', height: '18px', opacity: 0.7, color: '#EF4444' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                  </svg>
                ),
              },
              {
                label: 'My Bets',
                href: '/my-bets',
                icon: (
                  <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
                  </svg>
                ),
              },
              {
                label: 'Results',
                href: '/results',
                icon: (
                  <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                ),
              },
              {
                label: 'Account',
                href: '/account',
                icon: (
                  <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5z" />
                  </svg>
                ),
              },
            ].map((item) => {
              const quickActive = pathname === item.href || (item.href === '/sports' ? pathname.startsWith('/sports') : pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  style={{ textDecoration: 'none' }}
                >
                  <NavLink active={quickActive} badge={item.badge}>
                    {item.icon}
                    {item.label}
                  </NavLink>
                </Link>
              );
            })}
          </div>

          <div style={{ padding: '0 16px' }}>
            <div style={{ color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '12px', paddingLeft: '8px' }}>
              All Sports
            </div>
            <NavLink onClick={() => { setActiveSideNav('Football'); navigate('/sports/football'); }} active={activeSideNav === 'Football'} badge={sportCounts.football != null ? String(sportCounts.football) : '...'}>
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              Football
            </NavLink>

            <div style={customStyles.subNav}>
              {[
                { name: 'Premier League', flag: 'linear-gradient(to right, #ce1126, #fff, #ce1126)', slug: 'premier-league' },
                { name: 'La Liga', flag: 'linear-gradient(to bottom, #AA151B, #F1BF00)', slug: 'la-liga' },
                { name: 'Bundesliga', flag: 'linear-gradient(to bottom, #000, #dd0000, #ffce00)', slug: 'bundesliga' },
                { name: 'Serie A', flag: 'linear-gradient(to right, #009246, #fff, #ce2b37)', slug: 'serie-a' },
                { name: 'Champions League', flag: '#002F6C', slug: 'champions-league' },
              ].map((item) => {
                return (
                  <Link
                    key={item.name}
                    to={`/sports/football?league=${item.slug}`}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#F1F5F9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#94A3B8',
                      padding: '6px 0',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ width: '16px', height: '12px', borderRadius: '2px', background: item.flag }} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <NavLink onClick={() => { setActiveSideNav('Tennis'); navigate('/sports/tennis'); }} active={activeSideNav === 'Tennis'} badge={sportCounts.tennis != null ? String(sportCounts.tennis) : '...'}>
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.55.05-1.09.13-1.62L9 15.24V16c0 .55.45 1 1 1h2v-1.12l5.08 2.6c-1.39 1.01-3.13 1.52-5.08 1.52z" />
              </svg>
              Tennis
            </NavLink>
            <NavLink onClick={() => { setActiveSideNav('Basketball'); navigate('/sports/basketball'); }} active={activeSideNav === 'Basketball'} badge={sportCounts.basketball != null ? String(sportCounts.basketball) : '...'}>
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Basketball
            </NavLink>
            <NavLink onClick={() => { setActiveSideNav('Golf'); navigate('/sports/golf'); }} active={activeSideNav === 'Golf'} badge={sportCounts.golf != null ? String(sportCounts.golf) : '...'}>
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 3v18h2v-6h8l-3-4 3-4H8V3z" />
              </svg>
              Golf
            </NavLink>
            <NavLink onClick={() => { setActiveSideNav('Esports'); navigate('/sports/esports'); }} active={activeSideNav === 'Esports'} badge={sportCounts.esports != null ? String(sportCounts.esports) : '...'}>
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6h18v12H3V6zm3 2v8h12V8H6zm2 2h2v2H8v-2zm6 0h2v2h-2v-2z" />
              </svg>
              Esports
            </NavLink>
          </div>
        </aside>

        {/* Main Content */}
        <main style={customStyles.mainContent}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>In-Play Now</div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
            {filters.map(f => (
              <FilterPill key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
            ))}
          </div>

          {filteredLive.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '48px' }}>
              {filteredLive.map((match) => (
                <LiveCard
                  key={match.id}
                  league={match.league}
                  status={match.status}
                  team1={match.team1}
                  score1={match.score1}
                  team2={match.team2}
                  score2={match.score2}
                  detailHref={match.detailHref}
                  odds={match.odds}
                  selectedOdds={selectedOdds[`live-${match.id}`]}
                  onOddsClick={(i) => {
                    const selKey = `live-${match.id}-${i}`;
                    const odd = match.odds[i];
                    const wasSelected = selectedOdds[`live-${match.id}`] === i;
                    setSelectedOdds(prev => ({ ...prev, [`live-${match.id}`]: wasSelected ? null : i }));
                    if (wasSelected) {
                      removeFromSlip(selKey);
                    } else {
                      if (selectedOdds[`live-${match.id}`] != null) {
                        removeFromSlip(`live-${match.id}-${selectedOdds[`live-${match.id}`]}`);
                      }
                      addToSlip(`${match.team1} vs ${match.team2}`, 'Match Result', odd.label === '1' ? match.team1 : odd.label === '2' ? match.team2 : 'Draw', odd.value, selKey);
                    }
                  }}
                  markets={match.markets}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', marginBottom: '48px', background: '#1A2235', borderRadius: '12px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📡</div>
              <div style={{ color: '#94A3B8', fontSize: '14px' }}>No live {filterSportName(activeFilter)} matches right now</div>
              <div style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }}>Check back soon or browse upcoming events below</div>
            </div>
          )}

          {filteredUpcoming.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>{upcomingTitle}</div>
              </div>

              <table style={customStyles.leagueTable}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', color: '#64748B', fontSize: '12px', fontWeight: 500, padding: '8px 16px', width: '15%' }}>Time</th>
                    <th style={{ textAlign: 'left', color: '#64748B', fontSize: '12px', fontWeight: 500, padding: '8px 16px', width: '45%' }}>Event</th>
                    <th style={{ textAlign: 'left', color: '#64748B', fontSize: '12px', fontWeight: 500, padding: '8px 16px', width: '30%' }}>1X2 Odds</th>
                    <th style={{ textAlign: 'left', color: '#64748B', fontSize: '12px', fontWeight: 500, padding: '8px 16px', width: '10%' }}>Markets</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUpcoming.map((match, idx) => (
                    <UpcomingRow
                      key={idx}
                      match={match}
                      idx={idx}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                      selectedOdds={selectedOdds}
                      setSelectedOdds={setSelectedOdds}
                      addToSlip={addToSlip}
                      removeFromSlip={removeFromSlip}
                    />
                  ))}
                </tbody>
              </table>
            </>
          )}
        </main>

        {/* Betslip */}
        <aside style={customStyles.betslip}>
          <div style={{ padding: '16px', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-around' }}>
            {['Singles', 'Multiples', 'System'].map(tab => (
              <SlipTab key={tab} label={tab} active={activeSlipTab === tab} onClick={() => setActiveSlipTab(tab)} />
            ))}
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {betPlaced ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#00C37B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>✓</div>
                <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '16px' }}>Bet Placed!</div>
                <div style={{ color: '#94A3B8', fontSize: '13px' }}>Good luck!</div>
              </div>
            ) : slipSelections.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#64748B' }}>
                <div style={{ fontSize: '36px', opacity: 0.5 }}>🎯</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>Betslip Empty</div>
                <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: '1.5' }}>Click on odds to add selections</div>
              </div>
            ) : (
              slipSelections.map((sel) => (
                <div key={sel.selKey} style={customStyles.selectionCard}>
                  <div
                    onClick={() => removeFromSlip(sel.selKey)}
                    style={{ position: 'absolute', top: '8px', right: '8px', color: '#64748B', cursor: 'pointer', fontSize: '12px', lineHeight: 1, padding: '4px', borderRadius: '4px', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                  >✕</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>{sel.matchLabel}</div>
                  <div style={{ fontWeight: 600, color: '#00C37B', fontSize: '14px', marginBottom: '2px' }}>{sel.outcomeLabel}</div>
                  <div style={{ fontSize: '13px', color: '#F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{sel.market}</span>
                    <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 700, color: '#F59E0B' }}>{sel.odds}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {!betPlaced && (
            <div style={{ padding: '16px', background: '#1A2235', borderTop: '1px solid #1E293B' }}>
              {slipSelections.length > 1 && activeSlipTab !== 'Singles' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
                  <span>Combined odds</span>
                  <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 700, color: '#F59E0B' }}>{totalOdds.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  style={customStyles.stakeInput}
                  placeholder="Enter stake..."
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {['+10', '+25', '+50', 'MAX'].map(amt => (
                  <QuickStakeBtn key={amt} label={amt} onClick={() => handleQuickStake(amt)} />
                ))}
              </div>
              {isAuthenticated && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                  <span>Available</span>
                  <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 600, color: (parseFloat(stake) || 0) > balance ? '#EF4444' : '#94A3B8' }}>{formatBalance()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '12px' }}>
                <span>Est. Returns</span>
                <span style={{ color: '#00C37B', fontWeight: 700, fontFamily: 'Roboto Mono, monospace' }}>{estReturn} CR</span>
              </div>
              {betError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: '#EF4444', textAlign: 'center' }}>
                  {betError}
                </div>
              )}
              <button
                onClick={handlePlaceBet}
                disabled={slipSelections.length === 0 || isPlacing}
                style={{
                  ...customStyles.placeBetBtn,
                  background: isPlacing ? '#1E293B' : slipSelections.length === 0 ? '#334155' : (parseFloat(stake) || 0) > balance && isAuthenticated ? '#EF4444' : '#00C37B',
                  color: isPlacing ? '#94A3B8' : slipSelections.length === 0 ? '#64748B' : '#000',
                  cursor: slipSelections.length === 0 || isPlacing ? 'not-allowed' : 'pointer',
                  opacity: isPlacing ? 0.7 : 1,
                }}
              >
                {isPlacing ? 'PLACING...' : !isAuthenticated && slipSelections.length > 0 ? 'LOGIN TO BET' : slipSelections.length === 0 ? 'ADD SELECTIONS' : (parseFloat(stake) || 0) > balance && isAuthenticated ? 'INSUFFICIENT BALANCE' : `PLACE BET (${slipSelections.length})`}
              </button>
              {slipSelections.length > 0 && (
                <div
                  onClick={() => { setSlipSelections([]); setSelectedOdds({}); setBetError(null); }}
                  style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#EF4444', cursor: 'pointer', transition: 'opacity 0.15s' }}
                >
                  Clear all selections
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: slipSelections.length > 0 ? '8px' : '12px', fontSize: '11px', color: '#64748B' }}>
                Odds changes accepted automatically
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default App;
