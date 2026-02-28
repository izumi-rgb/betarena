import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Link, useLocation, useNavigate } from 'react-router-dom';

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

const OddsCellButton = ({ value, flash }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...customStyles.oddsCellBtn,
        background: hovered ? '#2d3b55' : '#0B0E1A',
        color: hovered ? '#F1F5F9' : '#00C37B',
        animation: flash ? `${flash} 0.5s` : 'none',
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
  const [selectedOdds, setSelectedOdds] = useState({ 0: 1, 1: null, 2: null });
  const [stake, setStake] = useState('50.00');
  const [betPlaced, setBetPlaced] = useState(false);
  const [favorites, setFavorites] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = pulseKeyframes + `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap');
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const liveMatches = [
    {
      id: 0,
      league: 'Premier League',
      status: "74'",
      team1: 'Arsenal',
      score1: '2',
      team2: 'Chelsea',
      score2: '1',
      detailHref: '/sports',
      odds: [
        { label: '1', value: '1.25' },
        { label: 'X', value: '4.50' },
        { label: '2', value: '8.00' },
      ],
      markets: 112,
    },
    {
      id: 1,
      league: 'NBA',
      status: '3rd Qtr',
      team1: 'Lakers',
      score1: '88',
      team2: 'Warriors',
      score2: '92',
      detailHref: '/sports/basketball',
      odds: [
        { label: '1', value: '2.85' },
        { label: '2', value: '1.45' },
      ],
      markets: 45,
    },
    {
      id: 2,
      league: 'ATP Dubai',
      status: '2nd Set',
      team1: 'Djokovic',
      score1: '1',
      team2: 'Alcaraz',
      score2: '0',
      detailHref: '/sports/tennis',
      odds: [
        { label: '1', value: '1.18' },
        { label: '2', value: '4.20' },
      ],
      markets: 12,
    },
  ];

  const premierLeagueMatches = [
    { time: '20:00', team1: 'Man City', team2: 'Liverpool', odds: ['1.95', '3.60', '3.80'], markets: 140, flash: [null, null, null], detailHref: '/sports' },
    { time: '14:30', team1: 'Man Utd', team2: 'Tottenham', odds: ['2.40', '3.40', '2.90'], markets: 128, flash: ['up', null, 'down'], detailHref: '/sports' },
    { time: '17:00', team1: 'Aston Villa', team2: 'Everton', odds: ['1.75', '3.90', '4.50'], markets: 105, flash: [null, null, null], detailHref: '/sports' },
  ];

  const filters = ['All Sports', 'Football (54)', 'Tennis (12)', 'Basketball (8)', 'Esports (23)', 'Cricket (4)'];
  const navTabsWithHref = [
    { label: 'Sports', href: '/sports' },
    { label: 'In-Play', href: '/in-play' },
    { label: 'Live Stream', href: '/live' },
    { label: 'My Bets', href: '/my-bets' },
    { label: 'Results', href: '/results' },
    { label: 'Account', href: '/account' },
  ];
  const { pathname } = useLocation();

  const stakeNum = parseFloat(stake) || 0;
  const estReturn = (stakeNum * 1.45).toFixed(2);

  const handleQuickStake = (amount) => {
    if (amount === 'MAX') {
      setStake('2450.50');
    } else {
      const num = parseFloat(stake) || 0;
      setStake((num + parseFloat(amount.replace('+', ''))).toFixed(2));
    }
  };

  const handlePlaceBet = () => {
    setBetPlaced(true);
    setTimeout(() => setBetPlaced(false), 2000);
  };

  const toggleFavorite = (key) => {
    setFavorites(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    { label: 'Sports', path: 'Sports' },
    { label: 'In-Play', path: 'In-Play' },
    { label: 'Live Stream', path: 'Live Stream' },
    { label: 'My Bets', path: 'My Bets' },
    { label: 'Results', path: 'Results' },
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
            }}>$2,450.50</div>
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
                label: 'Live Stream',
                href: '/live',
                icon: (
                  <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 7l-7 5 7 5V7zM3 5h11v14H3V5z" />
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
            <NavLink onClick={() => setActiveSideNav('Football')} active={activeSideNav === 'Football'} badge="1,024">
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              Football
            </NavLink>

            <div style={customStyles.subNav}>
              {[
                { name: 'Premier League', flag: 'linear-gradient(to right, #ce1126, #fff, #ce1126)' },
                { name: 'La Liga', flag: 'linear-gradient(to bottom, #AA151B, #F1BF00)' },
                { name: 'Bundesliga', flag: 'linear-gradient(to bottom, #000, #dd0000, #ffce00)' },
                { name: 'Serie A', flag: 'linear-gradient(to right, #009246, #fff, #ce2b37)' },
                { name: 'Champions League', flag: '#002F6C' },
              ].map((item) => {
                return (
                  <div
                    key={item.name}
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
                    }}
                  >
                    <div style={{ width: '16px', height: '12px', borderRadius: '2px', background: item.flag }} />
                    {item.name}
                  </div>
                );
              })}
            </div>

            <NavLink onClick={() => { setActiveSideNav('Tennis'); navigate('/sports/tennis'); }} active={activeSideNav === 'Tennis'} badge="86">
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.55.05-1.09.13-1.62L9 15.24V16c0 .55.45 1 1 1h2v-1.12l5.08 2.6c-1.39 1.01-3.13 1.52-5.08 1.52z" />
              </svg>
              Tennis
            </NavLink>
            <NavLink onClick={() => { setActiveSideNav('Basketball'); navigate('/sports/basketball'); }} active={activeSideNav === 'Basketball'} badge="45">
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Basketball
            </NavLink>
            <NavLink onClick={() => { setActiveSideNav('Golf'); navigate('/sports/golf'); }} active={activeSideNav === 'Golf'} badge="24">
              <svg style={{ width: '18px', height: '18px', opacity: 0.7 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 3v18h2v-6h8l-3-4 3-4H8V3z" />
              </svg>
              Golf
            </NavLink>
            <NavLink onClick={() => { setActiveSideNav('Esports'); navigate('/sports/esports'); }} active={activeSideNav === 'Esports'} badge="23">
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '48px' }}>
            {liveMatches.map((match) => (
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
                selectedOdds={selectedOdds[match.id]}
                onOddsClick={(i) => setSelectedOdds(prev => ({ ...prev, [match.id]: prev[match.id] === i ? null : i }))}
                markets={match.markets}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>Premier League</div>
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
              {premierLeagueMatches.map((match, idx) => {
                const [rowHovered, setRowHovered] = useState(false);
                return (
                  <tr
                    key={idx}
                    onMouseEnter={() => setRowHovered(true)}
                    onMouseLeave={() => setRowHovered(false)}
                    style={{ background: rowHovered ? '#232d42' : '#1A2235' }}
                  >
                    <td style={{ padding: '12px 16px', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}>
                      <div style={{ color: '#94A3B8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          onClick={() => toggleFavorite(`${idx}`)}
                          style={{ color: favorites[`${idx}`] ? '#F59E0B' : '#64748B', cursor: 'pointer' }}
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
                        {match.odds.map((odd, oi) => (
                          <OddsCellButton key={oi} value={odd} flash={match.flash[oi]} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', paddingRight: '24px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}>
                      <Link to={match.detailHref} style={{ color: '#94A3B8', fontSize: '12px', textDecoration: 'none' }}>+{match.markets}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </main>

        {/* Betslip */}
        <aside style={customStyles.betslip}>
          <div style={{ padding: '16px', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-around' }}>
            {['Singles', 'Multiples', 'System'].map(tab => (
              <SlipTab key={tab} label={tab} active={activeSlipTab === tab} onClick={() => setActiveSlipTab(tab)} />
            ))}
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            <div style={customStyles.selectionCard}>
              <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#64748B', cursor: 'pointer', fontSize: '12px' }}>✕</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Lakers vs Warriors</div>
              <div style={{ fontWeight: 600, color: '#00C37B', fontSize: '14px', marginBottom: '2px' }}>Warriors Winner</div>
              <div style={{ fontSize: '13px', color: '#F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
                <span>Match Winner</span>
                <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 700, color: '#F59E0B' }}>1.45</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#1A2235', borderTop: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                style={customStyles.stakeInput}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {['+10', '+25', '+50', 'MAX'].map(amt => (
                <QuickStakeBtn key={amt} label={amt} onClick={() => handleQuickStake(amt)} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>
              <span>Est. Returns</span>
              <span style={{ color: '#00C37B', fontWeight: 700, fontFamily: 'Roboto Mono, monospace' }}>${estReturn}</span>
            </div>
            <button
              onClick={handlePlaceBet}
              style={{
                ...customStyles.placeBetBtn,
                background: betPlaced ? '#00a86b' : '#00C37B',
              }}
            >
              {betPlaced ? 'BET PLACED! ✓' : 'PLACE BET'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#64748B' }}>
              Odds changes accepted automatically
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;
