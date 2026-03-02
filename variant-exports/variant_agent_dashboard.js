import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useCredits } from '@/contexts/CreditsContext';

const customStyles = {
  appLayout: {
    display: 'grid',
    gridTemplateRows: '64px 1fr',
    gridTemplateColumns: '240px 1fr 320px',
    height: '100vh',
  },
  header: {
    gridColumn: '1 / -1',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #1E293B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 50,
  },
  brand: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#F1F5F9',
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navTabs: {
    display: 'flex',
    gap: '4px',
  },
  navItem: {
    padding: '8px 16px',
    borderRadius: '6px',
    color: '#94A3B8',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navItemActive: {
    padding: '8px 16px',
    borderRadius: '6px',
    color: '#F1F5F9',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#1A2235',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  balanceChip: {
    background: '#0B0E1A',
    border: '1px solid #1E293B',
    padding: '6px 12px',
    borderRadius: '20px',
    fontFamily: "'Roboto Mono', monospace",
    fontWeight: 700,
    color: '#00C37B',
    fontSize: '13px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    border: '2px solid #1A2235',
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
  sidebarSection: {
    padding: '0 16px',
  },
  sidebarTitle: {
    color: '#64748B',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    marginBottom: '12px',
    paddingLeft: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '6px',
    color: '#94A3B8',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '2px',
  },
  navLinkActive: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '6px',
    color: '#F1F5F9',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '2px',
    backgroundColor: '#1E2D45',
    borderLeft: '3px solid #00C37B',
  },
  navLinkContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  navIcon: {
    width: '18px',
    height: '18px',
    fill: 'currentColor',
    opacity: 0.7,
  },
  countBadge: {
    fontSize: '11px',
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#64748B',
  },
  subNav: {
    marginLeft: '28px',
    marginTop: '4px',
    borderLeft: '1px solid #1E293B',
    paddingLeft: '12px',
  },
  subLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#94A3B8',
    padding: '6px 0',
    cursor: 'pointer',
  },
  subLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#00C37B',
    fontWeight: 600,
    padding: '6px 0',
    cursor: 'pointer',
  },
  flagIcon: {
    width: '16px',
    height: '12px',
    borderRadius: '2px',
    objectFit: 'cover',
  },
  mainContent: {
    overflowY: 'auto',
    backgroundColor: '#0B0E1A',
  },
  matchHero: {
    background: 'linear-gradient(180deg, #0d1829 0%, #162038 50%, #0B0E1A 100%)',
    padding: '44px 48px 32px',
    borderBottom: '1px solid #1E293B',
    position: 'relative',
    overflow: 'hidden',
  },
  matchHeroAfter: {
    content: "''",
    position: 'absolute',
    top: '-80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '500px',
    height: '340px',
    background: 'radial-gradient(ellipse, rgba(0,195,123,0.07) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748B',
    marginBottom: '24px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  matchScoreboard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  teamDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    width: '170px',
  },
  teamBadgeArsenal: {
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '34px',
    fontWeight: 800,
    color: 'white',
    letterSpacing: '-1px',
    background: 'linear-gradient(135deg, #EF4444, #991B1B)',
    border: '3px solid rgba(255,255,255,0.2)',
    boxShadow: '0 0 32px rgba(239,68,68,0.35)',
  },
  teamBadgeChelsea: {
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '34px',
    fontWeight: 800,
    color: 'white',
    letterSpacing: '-1px',
    background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
    border: '3px solid rgba(255,255,255,0.2)',
    boxShadow: '0 0 32px rgba(59,130,246,0.35)',
  },
  teamName: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#F1F5F9',
    letterSpacing: '-0.3px',
  },
  scoreDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  matchScore: {
    fontSize: '80px',
    fontFamily: "'Roboto Mono', monospace",
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '4px',
    lineHeight: 1,
    textShadow: '0 4px 24px rgba(0,0,0,0.5)',
  },
  liveTimerBadge: {
    background: 'rgba(239,68,68,0.18)',
    color: '#EF4444',
    border: '1px solid rgba(239,68,68,0.45)',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 800,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: 0,
    paddingTop: '28px',
    marginTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  statItem: {
    textAlign: 'center',
    flex: 1,
    padding: '0 16px',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  statLabel: {
    fontSize: '10px',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: '6px',
  },
  statVal: {
    fontFamily: "'Roboto Mono', monospace",
    fontSize: '14px',
    color: '#94A3B8',
    fontWeight: 500,
  },
  marketsContainer: {
    padding: '24px 32px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  marketAccordion: {
    background: '#1A2235',
    border: '1px solid #1E293B',
    borderRadius: '6px',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  accordionHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid #1E293B',
    transition: 'background 0.2s',
  },
  marketContent: {
    padding: '16px',
    background: 'rgba(11, 14, 26, 0.3)',
  },
  oddsGrid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  oddsGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  oddsBtn: {
    background: '#1E2D45',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: '1px solid transparent',
  },
  oddsBtnSelected: {
    background: '#00C37B',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: '1px solid #00C37B',
  },
  outcomeName: {
    fontSize: '13px',
    color: '#94A3B8',
    fontWeight: 500,
  },
  outcomeNameSelected: {
    fontSize: '13px',
    color: '#000',
    fontWeight: 700,
  },
  outcomeOdds: {
    fontFamily: "'Roboto Mono', monospace",
    color: '#F59E0B',
    fontWeight: 700,
    fontSize: '13px',
  },
  outcomeOddsSelected: {
    fontFamily: "'Roboto Mono', monospace",
    color: '#000',
    fontWeight: 700,
    fontSize: '13px',
  },
  asianRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '8px',
  },
  scorerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  htFtGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  betslip: {
    backgroundColor: '#111827',
    borderLeft: '1px solid #1E293B',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 40,
  },
  betslipHeader: {
    padding: '16px',
    borderBottom: '1px solid #1E293B',
    display: 'flex',
    justifyContent: 'space-around',
  },
  slipTab: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94A3B8',
    cursor: 'pointer',
    paddingBottom: '8px',
    borderBottom: '2px solid transparent',
  },
  slipTabActive: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#F1F5F9',
    cursor: 'pointer',
    paddingBottom: '8px',
    borderBottom: '2px solid #00C37B',
  },
  slipContent: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
  },
  selectionCard: {
    background: '#1A2235',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px',
    border: '1px solid #1E293B',
    position: 'relative',
  },
  removeBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    color: '#64748B',
    cursor: 'pointer',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontSize: '12px',
  },
  selMatch: {
    fontSize: '11px',
    color: '#64748B',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  selMarket: {
    fontSize: '12px',
    color: '#94A3B8',
    marginBottom: '4px',
  },
  selDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  selOutcome: {
    fontWeight: 600,
    color: '#00C37B',
    fontSize: '14px',
  },
  selOdds: {
    fontFamily: "'Roboto Mono', monospace",
    fontWeight: 700,
    color: '#F59E0B',
    background: 'rgba(245, 158, 11, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  selOddsSelected: {
    fontFamily: "'Roboto Mono', monospace",
    fontWeight: 700,
    color: '#000',
    background: '#F59E0B',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  stakeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stakeLabel: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  stakeInputMini: {
    flex: 1,
    background: '#0B0E1A',
    border: '1px solid #1E293B',
    color: '#F1F5F9',
    padding: '6px 8px',
    borderRadius: '4px',
    fontFamily: "'Roboto Mono', monospace",
    textAlign: 'right',
    fontSize: '12px',
    outline: 'none',
  },
  betslipFooter: {
    padding: '16px',
    background: '#1A2235',
    borderTop: '1px solid #1E293B',
  },
  quickStakes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  qsBtn: {
    background: '#0B0E1A',
    border: '1px solid #1E293B',
    color: '#94A3B8',
    padding: '8px 0',
    fontSize: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.1s',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#94A3B8',
    marginBottom: '8px',
  },
  summaryRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#94A3B8',
    marginBottom: '8px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #1E293B',
    fontWeight: 600,
  },
  returnVal: {
    color: '#00C37B',
    fontWeight: 700,
    fontFamily: "'Roboto Mono', monospace",
  },
  stakeVal: {
    color: '#F1F5F9',
    fontFamily: "'Roboto Mono', monospace",
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
    marginTop: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};

const OddsButton = ({ outcomeName, outcomeOdds, isSelected, onClick, style, nameStyle }) => {
  return (
    <div
      style={isSelected ? { ...customStyles.oddsBtnSelected, ...style } : { ...customStyles.oddsBtn, ...style }}
      onClick={onClick}
    >
      <span style={isSelected ? { ...customStyles.outcomeNameSelected, ...nameStyle } : { ...customStyles.outcomeName, ...nameStyle }}>
        {outcomeName}
      </span>
      <span style={isSelected ? customStyles.outcomeOddsSelected : customStyles.outcomeOdds}>
        {outcomeOdds}
      </span>
    </div>
  );
};

const MarketAccordion = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={customStyles.marketAccordion}>
      <div
        style={customStyles.accordionHeader}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={e => e.currentTarget.style.background = '#232d42'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#F1F5F9',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ display: 'block', width: '3px', height: '14px', background: '#00C37B', borderRadius: '2px' }}></span>
          {title}
        </div>
        <svg
          style={{ color: '#64748B', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {isOpen && (
        <div style={customStyles.marketContent}>
          {children}
        </div>
      )}
    </div>
  );
};

const LiveDot = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap');
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      .live-dot-anim {
        width: 6px;
        height: 6px;
        background: #EF4444;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }
      body {
        font-family: 'Inter', sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #0B0E1A; }
      ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #64748B; }
      input:focus { outline: none; border-color: #00C37B !important; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return <div className="live-dot-anim"></div>;
};

const MatchPage = () => {
  const { balance, isLoading: balanceLoading, formatBalance } = useCredits();
  const [activeSlipTab, setActiveSlipTab] = useState('Singles');
  const [selectedOdds, setSelectedOdds] = useState({
    matchResult: 'Arsenal',
    correctScore: '2-1',
  });
  const [selections, setSelections] = useState([
    { id: 1, match: 'Arsenal vs Chelsea', market: 'Match Result', outcome: 'Arsenal', odds: '1.28', stake: '25.00', oddsUp: true, oldOdds: '1.22' },
    { id: 2, match: 'Arsenal vs Chelsea', market: 'Correct Score', outcome: '2 – 1', odds: '7.50', stake: '10.00' },
    { id: 3, match: 'Arsenal vs Chelsea', market: 'First Goalscorer', outcome: 'B. Saka', odds: '4.50', stake: '5.00' },
  ]);

  const removeSelection = (id) => {
    setSelections(prev => prev.filter(s => s.id !== id));
  };

  const updateStake = (id, value) => {
    setSelections(prev => prev.map(s => s.id === id ? { ...s, stake: value } : s));
  };

  const addQuickStake = (amount) => {
    if (selections.length > 0) {
      const lastId = selections[selections.length - 1].id;
      setSelections(prev => prev.map(s => s.id === lastId ? { ...s, stake: (parseFloat(s.stake || 0) + amount).toFixed(2) } : s));
    }
  };

  const totalStake = selections.reduce((acc, s) => acc + parseFloat(s.stake || 0), 0);
  const estReturns = selections.reduce((acc, s) => acc + parseFloat(s.stake || 0) * parseFloat(s.odds), 0);

  const navItems = [
    { label: 'Home', href: '/sports' },
    { label: 'In-Play', href: '/dashboard' },
    { label: 'Results', href: '/reports' },
    { label: 'My Bets', href: '/my-bets' },
    { label: 'Account', href: '/account' },
  ];
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const matchResultOdds = [
    { name: 'Arsenal', odds: '1.22', key: 'Arsenal' },
    { name: 'Draw', odds: '5.50', key: 'Draw' },
    { name: 'Chelsea', odds: '9.00', key: 'Chelsea' },
  ];

  const bttsOdds = [
    { name: 'Yes', odds: '1.72', key: 'btts-yes' },
    { name: 'No', odds: '2.05', key: 'btts-no' },
  ];

  const totalGoalsRows = [
    [{ name: 'Over 2.5', odds: '1.65', key: 'o2.5' }, { name: 'Under 2.5', odds: '2.20', key: 'u2.5' }],
    [{ name: 'Over 3.5', odds: '2.80', key: 'o3.5' }, { name: 'Under 3.5', odds: '1.40', key: 'u3.5' }],
  ];

  const asianRows = [
    [{ name: 'Arsenal -1.5', odds: '2.10', key: 'a-1.5' }, { name: 'Chelsea +1.5', odds: '1.72', key: 'c+1.5' }],
    [{ name: 'Arsenal -1.0', odds: '1.75', key: 'a-1.0' }, { name: 'Chelsea +1.0', odds: '2.05', key: 'c+1.0' }],
    [{ name: 'Arsenal -0.5', odds: '1.42', key: 'a-0.5' }, { name: 'Chelsea +0.5', odds: '2.65', key: 'c+0.5' }],
  ];

  const correctScoreArsenal = [
    { name: '1-0', odds: '6.50' }, { name: '2-0', odds: '8.00' }, { name: '2-1', odds: '7.50' },
    { name: '3-0', odds: '14.00' }, { name: '3-1', odds: '12.00' }, { name: '3-2', odds: '22.00' },
    { name: '4-0', odds: '24.00' }, { name: '4-1', odds: '32.00' }, { name: '4-2', odds: '55.00' },
    { name: '4-3', odds: '90.00' },
  ];
  const correctScoreDraw = [
    { name: '0-0', odds: '11.00' }, { name: '1-1', odds: '8.50' }, { name: '2-2', odds: '18.00' },
    { name: '3-3', odds: '40.00' },
  ];
  const correctScoreChelsea = [
    { name: '0-1', odds: '18.00' }, { name: '0-2', odds: '28.00' }, { name: '0-3', odds: '45.00' },
    { name: '1-2', odds: '34.00' }, { name: '1-3', odds: '65.00' }, { name: '2-3', odds: '55.00' },
    { name: '0-4', odds: '80.00' },
  ];

  const scorecasts = [
    { name: 'Saka & 1-0', odds: '32.00' }, { name: 'Saka & 2-0', odds: '45.00' }, { name: 'Saka & 2-1', odds: '38.00' },
    { name: 'Havertz & 1-0', odds: '40.00' }, { name: 'Havertz & 2-1', odds: '50.00' }, { name: 'Palmer & 0-1', odds: '90.00' },
    { name: 'Sterling & 0-1', odds: '75.00' }, { name: 'Odegaard & 2-0', odds: '55.00' }, { name: 'Jackson & 0-2', odds: '110.00' },
  ];

  const firstGoalscorers = [
    { name: 'B. Saka', odds: '4.50' }, { name: 'K. Havertz', odds: '5.00' }, { name: 'M. Odegaard', odds: '6.00' },
    { name: 'R. Sterling', odds: '7.00' }, { name: 'C. Palmer', odds: '7.50' }, { name: 'N. Jackson', odds: '9.00' },
    { name: 'L. Trossard', odds: '8.00' }, { name: 'E. Nketiah', odds: '10.00' }, { name: 'C. Gallagher', odds: '11.00' },
  ];

  const htFtOdds = [
    { name: 'Arsenal / Arsenal', odds: '1.55' }, { name: 'Arsenal / Draw', odds: '8.00' }, { name: 'Arsenal / Chelsea', odds: '28.00' },
    { name: 'Draw / Arsenal', odds: '5.50' }, { name: 'Draw / Draw', odds: '9.00' }, { name: 'Draw / Chelsea', odds: '18.00' },
    { name: 'Chelsea / Arsenal', odds: '45.00' }, { name: 'Chelsea / Draw', odds: '32.00' }, { name: 'Chelsea / Chelsea', odds: '12.00' },
  ];

  const cornersRows = [
    [{ name: 'Over 9.5', odds: '1.85', key: 'co9.5' }, { name: 'Under 9.5', odds: '1.95', key: 'cu9.5' }],
    [{ name: 'Over 10.5', odds: '2.30', key: 'co10.5' }, { name: 'Under 10.5', odds: '1.58', key: 'cu10.5' }],
    [{ name: 'Over 11.5', odds: '3.20', key: 'co11.5' }, { name: 'Under 11.5', odds: '1.32', key: 'cu11.5' }],
  ];

  const cardsRows = [
    [{ name: 'Over 3.5', odds: '1.90', key: 'crd-o3.5' }, { name: 'Under 3.5', odds: '1.90', key: 'crd-u3.5' }],
    [{ name: 'Over 4.5', odds: '2.80', key: 'crd-o4.5' }, { name: 'Under 4.5', odds: '1.42', key: 'crd-u4.5' }],
  ];

  const toggleOdds = (market, key) => {
    setSelectedOdds(prev => ({
      ...prev,
      [market]: prev[market] === key ? null : key,
    }));
  };

  return (
    <div style={{ backgroundColor: '#0B0E1A', color: '#F1F5F9', fontFamily: "'Inter', sans-serif", fontSize: '14px', lineHeight: 1.5, height: '100vh', overflow: 'hidden' }}>
      <div style={customStyles.appLayout}>
        {/* Header */}
        <header style={customStyles.header}>
          <div style={customStyles.brand}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#00C37B' }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
            BET<span style={{ color: '#00C37B' }}>ARENA</span>
          </div>

          <nav style={customStyles.navTabs}>
            {navItems.map(item => {
              const active = pathname === item.href || (item.href === '/sports' ? pathname.startsWith('/sports') : pathname.startsWith(item.href));
              return (
              <Link
                key={item.href}
                to={item.href}
                style={active ? customStyles.navItemActive : customStyles.navItem}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#F1F5F9'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; } }}
                
              >
                {item.label}
              </Link>
            )})}
          </nav>

          <div style={customStyles.userArea}>
            <div style={customStyles.balanceChip}>{balanceLoading ? '...' : formatBalance()}</div>
            <div style={customStyles.avatar}></div>
          </div>
        </header>

        {/* Sidebar */}
        <aside style={customStyles.sidebar}>
          <div style={customStyles.sidebarSection}>
            <div style={customStyles.sidebarTitle}>Quick Links</div>
            <div style={customStyles.navLink}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A2235'; e.currentTarget.style.color = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <div style={customStyles.navLinkContent}>
                <svg style={customStyles.navIcon} viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" />
                </svg>
                Favourites
              </div>
            </div>
            <div style={customStyles.navLinkActive}>
              <div style={customStyles.navLinkContent}>
                <svg style={{ ...customStyles.navIcon, color: '#EF4444' }} viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor" />
                </svg>
                In-Play
              </div>
              <span style={{ ...customStyles.countBadge, color: '#F1F5F9' }}>142</span>
            </div>
            <div style={customStyles.navLink}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A2235'; e.currentTarget.style.color = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <div style={customStyles.navLinkContent}>
                <svg style={customStyles.navIcon} viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor" />
                </svg>
                Starting Soon
              </div>
            </div>
          </div>

          <div style={customStyles.sidebarSection}>
            <div style={customStyles.sidebarTitle}>All Sports</div>
            <div style={{ ...customStyles.navLink, background: '#1A2235' }}>
              <div style={customStyles.navLinkContent}>
                <svg style={customStyles.navIcon} viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
                </svg>
                Football
              </div>
              <span style={customStyles.countBadge}>1,024</span>
            </div>

            <div style={customStyles.subNav}>
              <div style={customStyles.subLinkActive}>
                <div style={{ ...customStyles.flagIcon, background: 'linear-gradient(to right, #ce1126, #fff, #ce1126)' }}></div>
                Premier League
              </div>
              <div style={customStyles.subLink}
                onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
              >
                <div style={{ ...customStyles.flagIcon, background: 'linear-gradient(to bottom, #AA151B, #F1BF00)' }}></div>
                La Liga
              </div>
              <div style={customStyles.subLink}
                onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
              >
                <div style={{ ...customStyles.flagIcon, background: 'linear-gradient(to bottom, #000, #dd0000, #ffce00)' }}></div>
                Bundesliga
              </div>
              <div style={customStyles.subLink}
                onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
              >
                <div style={{ ...customStyles.flagIcon, background: 'linear-gradient(to right, #009246, #fff, #ce2b37)' }}></div>
                Serie A
              </div>
              <div style={customStyles.subLink}
                onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
              >
                <div style={{ ...customStyles.flagIcon, background: '#002F6C' }}></div>
                Champions League
              </div>
            </div>

            <div style={customStyles.navLink}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A2235'; e.currentTarget.style.color = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <div style={customStyles.navLinkContent}>
                <svg style={customStyles.navIcon} viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.55.05-1.09.13-1.62L9 15.24V16c0 .55.45 1 1 1h2v-1.12l5.08 2.6c-1.39 1.01-3.13 1.52-5.08 1.52z" fill="currentColor" />
                </svg>
                Tennis
              </div>
              <span style={customStyles.countBadge}>86</span>
            </div>
            <div style={customStyles.navLink}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A2235'; e.currentTarget.style.color = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <div style={customStyles.navLinkContent}>
                <svg style={customStyles.navIcon} viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                </svg>
                Basketball
              </div>
              <span style={customStyles.countBadge}>45</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={customStyles.mainContent}>
          <div style={customStyles.matchHero}>
            <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '340px', background: 'radial-gradient(ellipse, rgba(0,195,123,0.07) 0%, transparent 65%)', pointerEvents: 'none' }}></div>
            <div style={customStyles.breadcrumb}>
              Premier League <span style={{ fontSize: '8px' }}>●</span> <span style={{ color: '#94A3B8' }}>Matchday 28</span>
            </div>

            <div style={customStyles.matchScoreboard}>
              <div style={customStyles.teamDisplay}>
                <div style={customStyles.teamBadgeArsenal}>A</div>
                <div style={customStyles.teamName}>Arsenal</div>
              </div>

              <div style={customStyles.scoreDisplay}>
                <div style={customStyles.liveTimerBadge}>
                  <LiveDot /> LIVE • 67'
                </div>
                <div style={customStyles.matchScore}>
                  2 <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '64px', verticalAlign: 'middle', margin: '0 2px' }}>–</span> 1
                </div>
              </div>

              <div style={customStyles.teamDisplay}>
                <div style={customStyles.teamBadgeChelsea}>C</div>
                <div style={customStyles.teamName}>Chelsea</div>
              </div>
            </div>

            <div style={customStyles.statsBar}>
              {[
                { label: 'Possession', val: '67%', rest: '– 33%' },
                { label: 'Shots', val: '12', rest: '– 6' },
                { label: 'Corners', val: '7', rest: '– 3' },
                { label: 'On Target', val: '5', rest: '– 2' },
                { label: 'Yellow Cards', val: '2', rest: '– 3' },
              ].map((stat, i, arr) => (
                <div key={stat.label} style={{ ...customStyles.statItem, borderRight: i === arr.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={customStyles.statLabel}>{stat.label}</div>
                  <div style={customStyles.statVal}>
                    <span style={{ color: '#F1F5F9', fontWeight: 700 }}>{stat.val}</span> {stat.rest}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={customStyles.marketsContainer}>
            {/* Match Result */}
            <MarketAccordion title="Match Result (1X2)">
              <div style={customStyles.oddsGrid3}>
                {matchResultOdds.map(o => (
                  <OddsButton
                    key={o.key}
                    outcomeName={o.name}
                    outcomeOdds={o.odds}
                    isSelected={selectedOdds.matchResult === o.key}
                    onClick={() => toggleOdds('matchResult', o.key)}
                  />
                ))}
              </div>
            </MarketAccordion>

            {/* Both Teams To Score */}
            <MarketAccordion title="Both Teams To Score">
              <div style={customStyles.oddsGrid2}>
                {bttsOdds.map(o => (
                  <OddsButton
                    key={o.key}
                    outcomeName={o.name}
                    outcomeOdds={o.odds}
                    isSelected={selectedOdds.btts === o.key}
                    onClick={() => toggleOdds('btts', o.key)}
                  />
                ))}
              </div>
            </MarketAccordion>

            {/* Total Goals */}
            <MarketAccordion title="Total Goals Over/Under">
              {totalGoalsRows.map((row, i) => (
                <div key={i} style={{ ...customStyles.asianRow, marginBottom: i === totalGoalsRows.length - 1 ? 0 : '8px' }}>
                  {row.map(o => (
                    <OddsButton
                      key={o.key}
                      outcomeName={o.name}
                      outcomeOdds={o.odds}
                      isSelected={selectedOdds.totalGoals === o.key}
                      onClick={() => toggleOdds('totalGoals', o.key)}
                    />
                  ))}
                </div>
              ))}
            </MarketAccordion>

            {/* Asian Handicap */}
            <MarketAccordion title="Asian Handicap">
              {asianRows.map((row, i) => (
                <div key={i} style={{ ...customStyles.asianRow, marginBottom: i === asianRows.length - 1 ? 0 : '8px' }}>
                  {row.map(o => (
                    <OddsButton
                      key={o.key}
                      outcomeName={o.name}
                      outcomeOdds={o.odds}
                      isSelected={selectedOdds.asian === o.key}
                      onClick={() => toggleOdds('asian', o.key)}
                    />
                  ))}
                </div>
              ))}
            </MarketAccordion>

            {/* Correct Score */}
            <MarketAccordion title="Correct Score">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '4px' }}>
                {['Arsenal Win', 'Draw', 'Chelsea Win', 'Other'].map(h => (
                  <div key={h} style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 6px' }}>{h}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                {correctScoreArsenal.map((o, i) => (
                  <OddsButton
                    key={o.name}
                    outcomeName={o.name}
                    outcomeOdds={o.odds}
                    isSelected={selectedOdds.correctScore === o.name}
                    onClick={() => toggleOdds('correctScore', o.name)}
                  />
                ))}
                {correctScoreDraw.map(o => (
                  <OddsButton
                    key={o.name}
                    outcomeName={o.name}
                    outcomeOdds={o.odds}
                    isSelected={selectedOdds.correctScore === o.name}
                    onClick={() => toggleOdds('correctScore', o.name)}
                  />
                ))}
                {correctScoreChelsea.map(o => (
                  <OddsButton
                    key={o.name}
                    outcomeName={o.name}
                    outcomeOdds={o.odds}
                    isSelected={selectedOdds.correctScore === o.name}
                    onClick={() => toggleOdds('correctScore', o.name)}
                  />
                ))}
                <OddsButton
                  outcomeName="Any Other Score"
                  outcomeOdds="12.00"
                  isSelected={selectedOdds.correctScore === 'other'}
                  onClick={() => toggleOdds('correctScore', 'other')}
                  style={{ gridRow: 'span 5', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', gap: '6px' }}
                  nameStyle={{ fontSize: '11px', lineHeight: 1.3 }}
                />
              </div>
            </MarketAccordion>

            {/* Scorecast */}
            <MarketAccordion title="Scorecast">
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px', padding: '8px', background: 'rgba(0,195,123,0.04)', borderRadius: '4px', borderLeft: '2px solid #00C37B' }}>
                First Goalscorer combined with Correct Score
              </div>
              <div style={customStyles.scorerGrid}>
                {scorecasts.map(o => (
                  <OddsButton
                    key={o.name}
                    outcomeName={o.name}
                    outcomeOdds={o.odds}
                    isSelected={selectedOdds.scorecast === o.name}
                    onClick={() => toggleOdds('scorecast', o.name)}
                    nameStyle={{ fontSize: '11px' }}
                  />
                ))}
              </div>
            </MarketAccordion>

            {/* First Goalscorer */}
            <MarketAccordion title="First Goalscorer">
              <div style={customStyles.scorerGrid}>
                {firstGoalscorers.map(o => (
                  <OddsButton
                    key={o.name}
                    outcomeName={o.name}
                    outcomeOdds={o.odds}
                    isSelected={selectedOdds.firstScorer === o.name}
                    onClick={() => toggleOdds('firstScorer', o.name)}
                  />
                ))}
              </div>
            </MarketAccordion>

            {/* HT/FT */}
            <MarketAccordion title="Half Time / Full Time">
              <div style={customStyles.htFtGrid}>
                {htFtOdds.map(o => (
                  <OddsButton
                    key={o.name}
                    outcomeName={o.name}
                    outcomeOdds={o.odds}
                    isSelected={selectedOdds.htFt === o.name}
                    onClick={() => toggleOdds('htFt', o.name)}
                  />
                ))}
              </div>
            </MarketAccordion>

            {/* Total Corners */}
            <MarketAccordion title="Total Corners">
              {cornersRows.map((row, i) => (
                <div key={i} style={{ ...customStyles.asianRow, marginBottom: i === cornersRows.length - 1 ? 0 : '8px' }}>
                  {row.map(o => (
                    <OddsButton
                      key={o.key}
                      outcomeName={o.name}
                      outcomeOdds={o.odds}
                      isSelected={selectedOdds.corners === o.key}
                      onClick={() => toggleOdds('corners', o.key)}
                    />
                  ))}
                </div>
              ))}
            </MarketAccordion>

            {/* Total Cards */}
            <MarketAccordion title="Total Cards">
              {cardsRows.map((row, i) => (
                <div key={i} style={{ ...customStyles.asianRow, marginBottom: i === cardsRows.length - 1 ? 0 : '8px' }}>
                  {row.map(o => (
                    <OddsButton
                      key={o.key}
                      outcomeName={o.name}
                      outcomeOdds={o.odds}
                      isSelected={selectedOdds.cards === o.key}
                      onClick={() => toggleOdds('cards', o.key)}
                    />
                  ))}
                </div>
              ))}
            </MarketAccordion>
          </div>
        </main>

        {/* Betslip */}
        <aside style={customStyles.betslip}>
          <div style={customStyles.betslipHeader}>
            {['Singles', 'Multiples', 'System'].map(tab => (
              <div
                key={tab}
                style={activeSlipTab === tab ? customStyles.slipTabActive : customStyles.slipTab}
                onClick={() => setActiveSlipTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          <div style={customStyles.slipContent}>
            {selections.map(sel => (
              <div
                key={sel.id}
                style={{
                  ...customStyles.selectionCard,
                  borderColor: sel.oddsUp ? 'rgba(0,195,123,0.4)' : '#1E293B',
                }}
              >
                <div
                  style={customStyles.removeBtn}
                  onClick={() => removeSelection(sel.id)}
                  onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}
                >✕</div>
                <div style={customStyles.selMatch}>
                  <span style={{ width: '4px', height: '4px', background: '#00C37B', borderRadius: '50%', display: 'inline-block' }}></span>
                  {sel.match}
                </div>
                <div style={customStyles.selMarket}>{sel.market}</div>
                <div style={{ ...customStyles.selDetails, alignItems: sel.oddsUp ? 'flex-start' : 'center' }}>
                  <span style={customStyles.selOutcome}>{sel.outcome}</span>
                  {sel.oddsUp ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      <span style={{ ...customStyles.selOddsSelected, background: '#00C37B', color: '#000' }}>{sel.odds}</span>
                      <span style={{ fontSize: '10px', color: '#00C37B', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                        ▲ was <span style={{ textDecoration: 'line-through', color: '#64748B', fontWeight: 400 }}>{sel.oldOdds}</span>
                      </span>
                    </div>
                  ) : (
                    <span style={customStyles.selOdds}>{sel.odds}</span>
                  )}
                </div>
                <div style={customStyles.stakeRow}>
                  <span style={customStyles.stakeLabel}>Stake</span>
                  <input
                    type="text"
                    style={customStyles.stakeInputMini}
                    value={sel.stake}
                    onChange={e => updateStake(sel.id, e.target.value)}
                  />
                </div>
              </div>
            ))}

            {selections.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748B', padding: '32px 16px', fontSize: '13px' }}>
                No selections added yet. Click on any odds to add them to your betslip.
              </div>
            )}
          </div>

          <div style={customStyles.betslipFooter}>
            <div style={customStyles.quickStakes}>
              {[5, 10, 25, 50].map(amount => (
                <button
                  key={amount}
                  style={customStyles.qsBtn}
                  onClick={() => addQuickStake(amount)}
                  onMouseEnter={e => { e.currentTarget.style.background = '#232d42'; e.currentTarget.style.color = '#F1F5F9'; e.currentTarget.style.borderColor = '#64748B'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0B0E1A'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#1E293B'; }}
                >
                  +{amount}
                </button>
              ))}
            </div>

            <div style={customStyles.summaryRow}>
              <span>Selections</span>
              <span style={customStyles.stakeVal}>{selections.length}</span>
            </div>
            <div style={customStyles.summaryRow}>
              <span>Total Stake</span>
              <span style={customStyles.stakeVal}>{totalStake.toFixed(2)} CR</span>
            </div>
            <div style={customStyles.summaryRowTotal}>
              <span>Est. Returns</span>
              <span style={customStyles.returnVal}>{estReturns.toFixed(2)} CR</span>
            </div>

            <button
              style={customStyles.placeBetBtn}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 195, 123, 0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(0)'}
              onClick={() => { if (selections.length > 0) alert(`Bet placed! Total stake: ${totalStake.toFixed(2)} CR`); }}
            >
              PLACE BET
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

const App = () => {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<MatchPage />} />
      </Routes>
    </Router>
  );
};

export default App;
