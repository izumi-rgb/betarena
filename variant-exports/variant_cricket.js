import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCredits } from '@/contexts/CreditsContext';
import { useAuthStore } from '@/stores/authStore';

const customStyles = {
  bgPrimary: '#0B0E1A',
  bgSecondary: '#111827',
  surface: '#1A2235',
  surfaceHover: '#232d42',
  border: '#1E293B',
  accent: '#00C37B',
  accentHover: '#00a86b',
  amber: '#F59E0B',
  danger: '#EF4444',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  teamMi: '#004BA0',
  teamRcb: '#EC1C24',
};

const BallDot = ({ type, children }) => {
  const baseStyle = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: "'Roboto Mono', monospace",
    marginRight: '6px',
    flexShrink: 0,
  };
  const typeStyles = {
    'run-4': { background: '#3B82F6', color: 'white', border: '1px solid rgba(255,255,255,0.1)' },
    'run-6': { background: '#00C37B', color: '#0B0E1A', border: '1px solid rgba(255,255,255,0.1)' },
    'wicket': { background: '#EF4444', color: 'white', border: '1px solid rgba(255,255,255,0.1)' },
    'dot': { background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' },
    'run-1': { background: '#1A2235', color: 'white', border: '1px solid #334155' },
    'run-2': { background: '#1A2235', color: 'white', border: '1px solid #334155' },
    'run-3': { background: '#1A2235', color: 'white', border: '1px solid #334155' },
  };
  return <div style={{ ...baseStyle, ...typeStyles[type] }}>{children}</div>;
};

const OddsButton = ({ label, odds, fullWidth, column }) => {
  const [selected, setSelected] = useState(false);
  return (
    <button
      onClick={() => setSelected(!selected)}
      className={`rounded-md p-3 flex ${column ? 'flex-col items-center justify-center gap-1' : 'justify-between items-center'} group transition-all${fullWidth ? ' w-full' : ''}`}
      style={{
        background: selected ? '#1A2235' : customStyles.bgPrimary,
        border: `1px solid ${selected ? customStyles.accent : customStyles.border}`,
      }}
    >
      <span className="text-[13px] font-medium group-hover:text-white" style={{ color: selected ? 'white' : customStyles.textSecondary }}>{label}</span>
      <span style={{ color: customStyles.amber, fontFamily: "'Roboto Mono', monospace", fontWeight: '700', fontSize: '14px' }}>{odds}</span>
    </button>
  );
};

const MarketCard = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: customStyles.surface, border: `1px solid ${customStyles.border}` }}>
      <div
        className="px-4 py-3 border-b flex justify-between items-center cursor-pointer transition-colors"
        style={{ borderColor: customStyles.border }}
        onClick={() => setOpen(!open)}
        onMouseEnter={e => e.currentTarget.style.background = customStyles.surfaceHover}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span className="text-white font-bold text-[14px]">{title}</span>
        <svg className="w-4 h-4" fill="none" stroke={customStyles.textSecondary} viewBox="0 0 24 24" style={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
        </svg>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
};

const Sidebar = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { balance } = useCredits();
  const [showMenu, setShowMenu] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    window.location.href = '/login';
  };

  return (
  <aside className="w-[240px] flex flex-col shrink-0 z-20" style={{ background: customStyles.bgSecondary, borderRight: `1px solid ${customStyles.border}` }}>
    <div className="h-16 flex items-center px-6" style={{ borderBottom: `1px solid ${customStyles.border}` }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill={customStyles.accent} className="mr-2">
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
      </svg>
      <div className="text-[20px] font-extrabold tracking-tight text-white">
        BET<span style={{ color: customStyles.accent }}>ARENA</span>
      </div>
    </div>
    <nav className="flex-1 py-6 px-3 space-y-1">
      <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group" style={{ color: customStyles.textSecondary }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
          <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="font-medium text-[14px]">Home</span>
      </a>
      <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md border-l-[3px] transition-colors relative" style={{ background: customStyles.surface, color: 'white', borderColor: customStyles.accent }}>
        <div className="absolute inset-0 rounded-md pointer-events-none" style={{ background: customStyles.accent, opacity: 0.05 }} />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={customStyles.accent} strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className="font-bold text-[14px]">In-Play</span>
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: customStyles.accent, color: customStyles.bgPrimary }}>LIVE</span>
      </a>
      <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group" style={{ color: customStyles.textSecondary }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        <span className="font-medium text-[14px]">Results</span>
      </a>
      <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group" style={{ color: customStyles.textSecondary }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        </svg>
        <span className="font-medium text-[14px]">Cricket</span>
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: customStyles.surface, color: customStyles.textSecondary, border: `1px solid ${customStyles.border}` }}>2</span>
      </a>
      <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group" style={{ color: customStyles.textSecondary }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
        <span className="font-medium text-[14px]">My Bets</span>
      </a>
      <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group" style={{ color: customStyles.textSecondary }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
          <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
        </svg>
        <span className="font-medium text-[14px]">Account</span>
      </a>
    </nav>
    {isAuthenticated && user && (
      <div className="p-4 relative" style={{ borderTop: `1px solid ${customStyles.border}` }}>
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-3 w-full text-left hover:bg-[#1A2235] rounded-lg p-1.5 -m-1.5 transition-colors"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: customStyles.accent, color: customStyles.bgPrimary, border: `1px solid ${customStyles.border}` }}>
            {getInitials(user.username)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-white text-[13px] font-bold truncate">{user.username}</span>
            <span className="text-[11px] font-mono" style={{ color: customStyles.accent }}>
              {balance != null ? `${balance.toFixed(2)} CR` : '...'}
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" style={{ color: customStyles.textSecondary }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-full left-4 right-4 mb-2 z-50 rounded-lg shadow-xl overflow-hidden" style={{ background: customStyles.surface, border: `1px solid ${customStyles.border}` }}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-[13px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    )}
  </aside>
  );
};

const BetSlip = () => {
  const [stakeValue, setStakeValue] = useState('50.00');
  const [slipTab, setSlipTab] = useState('Singles');
  const [betPlaced, setBetPlaced] = useState(false);

  const odds = 2.20;
  const stake = parseFloat(stakeValue) || 0;
  const toReturn = (stake * odds).toFixed(2);

  const handlePlaceBet = () => {
    setBetPlaced(true);
    setTimeout(() => setBetPlaced(false), 2000);
  };

  return (
    <aside className="w-[320px] flex flex-col shrink-0 z-20" style={{ background: customStyles.bgSecondary, borderLeft: `1px solid ${customStyles.border}` }}>
      <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: `1px solid ${customStyles.border}` }}>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-[15px]">Bet Slip</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: customStyles.accent, color: customStyles.bgPrimary }}>1</span>
        </div>
        <div className="cursor-pointer transition-colors" style={{ color: customStyles.textSecondary }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
      </div>
      <div className="flex" style={{ borderBottom: `1px solid ${customStyles.border}` }}>
        {['Singles', 'Multiples', 'System'].map(tab => (
          <button
            key={tab}
            onClick={() => setSlipTab(tab)}
            className="flex-1 py-3 text-[13px] font-medium transition-colors"
            style={{
              color: slipTab === tab ? customStyles.accent : customStyles.textTertiary,
              fontWeight: slipTab === tab ? '700' : '500',
              borderBottom: slipTab === tab ? `2px solid ${customStyles.accent}` : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="rounded-lg p-4 relative group" style={{ background: customStyles.surface, border: `1px solid ${customStyles.border}` }}>
          <button className="absolute top-2 right-2 transition-colors" style={{ color: customStyles.textTertiary }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-[14px]">Rohit Sharma</span>
          </div>
          <div className="text-[11px] font-bold uppercase mb-1" style={{ color: customStyles.accent }}>Top Runscorer</div>
          <div className="text-[11px] mb-3" style={{ color: customStyles.textTertiary }}>Mumbai Indians vs RCB</div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium" style={{ color: customStyles.textSecondary }}>Odds:</span>
            <span className="font-mono font-bold text-[18px]" style={{ color: customStyles.amber, fontFamily: "'Roboto Mono', monospace" }}>2.20</span>
          </div>
          <div className="rounded p-2 mb-3 transition-colors" style={{ background: customStyles.bgPrimary, border: `1px solid ${customStyles.border}` }}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px]" style={{ color: customStyles.textTertiary }}>Stake (CR)</span>
            </div>
            <input
              type="text"
              value={stakeValue}
              onChange={e => setStakeValue(e.target.value)}
              className="w-full bg-transparent text-right font-mono font-bold outline-none border-none p-0 focus:ring-0"
              style={{ color: 'white', fontFamily: "'Roboto Mono', monospace" }}
            />
          </div>
          <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${customStyles.border}` }}>
            <span className="text-[13px] text-white">To Return:</span>
            <span className="font-mono font-bold text-[16px]" style={{ color: customStyles.accent, fontFamily: "'Roboto Mono', monospace" }}>{toReturn} CR</span>
          </div>
        </div>
      </div>
      <div className="p-4" style={{ background: customStyles.bgSecondary, borderTop: `1px solid ${customStyles.border}` }}>
        <div className="flex justify-between items-center mb-4 text-[13px]">
          <span style={{ color: customStyles.textSecondary }}>Total Stake:</span>
          <span className="text-white font-mono font-bold" style={{ fontFamily: "'Roboto Mono', monospace" }}>{parseFloat(stakeValue || 0).toFixed(2)} CR</span>
        </div>
        <div className="flex justify-between items-center mb-4 text-[13px]">
          <span style={{ color: customStyles.textSecondary }}>Est. Returns:</span>
          <span className="font-mono font-bold" style={{ color: customStyles.accent, fontFamily: "'Roboto Mono', monospace" }}>{toReturn} CR</span>
        </div>
        <button
          onClick={handlePlaceBet}
          className="w-full font-extrabold text-[15px] py-3.5 rounded-lg uppercase tracking-wide transition-all"
          style={{
            background: betPlaced ? '#00a86b' : customStyles.accent,
            color: 'black',
            boxShadow: '0 4px 12px rgba(0,195,123,0.2)',
          }}
        >
          {betPlaced ? '✓ Bet Placed!' : 'Place Bet'}
        </button>
      </div>
    </aside>
  );
};

const Scorecard = () => (
  <div className="p-6 pb-2">
    <div className="rounded-xl overflow-hidden shadow-2xl relative" style={{ background: 'linear-gradient(180deg, #1A2235 0%, #111827 100%)', border: `1px solid ${customStyles.border}` }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" style={{ background: 'rgba(37, 99, 235, 0.05)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" style={{ background: 'rgba(220, 38, 38, 0.05)' }} />
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${customStyles.border}`, background: 'rgba(26, 34, 53, 0.5)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 rounded-sm" style={{ background: customStyles.teamMi }} />
          <div>
            <h2 className="text-white text-[20px] font-bold leading-none">MUMBAI INDIANS</h2>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: customStyles.accent }}>Batting</span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-[13px] mb-1" style={{ color: customStyles.textSecondary }}>CRR: 5.75</span>
          <div className="text-[32px] font-bold text-white leading-none" style={{ fontFamily: "'Roboto Mono', monospace" }}>
            187<span className="mx-1" style={{ color: customStyles.textTertiary }}>/</span>4
          </div>
        </div>
      </div>
      <div className="p-6">
        <table className="w-full text-left mb-6">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider" style={{ color: customStyles.textTertiary, borderBottom: `1px solid ${customStyles.border}` }}>
              <th className="pb-2 font-semibold">Batter</th>
              <th className="pb-2 font-semibold text-right">R</th>
              <th className="pb-2 font-semibold text-right">B</th>
              <th className="pb-2 font-semibold text-right">4s</th>
              <th className="pb-2 font-semibold text-right">6s</th>
              <th className="pb-2 font-semibold text-right">SR</th>
            </tr>
          </thead>
          <tbody style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '14px' }}>
            <tr style={{ borderBottom: `1px solid rgba(30,41,59,0.5)` }}>
              <td className="py-3 text-white font-medium">
                <span className="flex items-center gap-2">Rohit Sharma <span style={{ color: customStyles.accent, fontSize: '16px' }}>*</span></span>
              </td>
              <td className="py-3 text-white font-bold text-right">67</td>
              <td className="py-3 text-right" style={{ color: customStyles.textSecondary }}>45</td>
              <td className="py-3 text-right" style={{ color: '#3B82F6' }}>5</td>
              <td className="py-3 text-right" style={{ color: customStyles.accent }}>3</td>
              <td className="py-3 text-right" style={{ color: customStyles.textSecondary }}>148.8</td>
            </tr>
            <tr>
              <td className="py-3 text-white font-medium">Hardik Pandya</td>
              <td className="py-3 text-white font-bold text-right">23</td>
              <td className="py-3 text-right" style={{ color: customStyles.textSecondary }}>14</td>
              <td className="py-3 text-right" style={{ color: '#3B82F6' }}>2</td>
              <td className="py-3 text-right" style={{ color: customStyles.accent }}>2</td>
              <td className="py-3 text-right" style={{ color: customStyles.textSecondary }}>164.2</td>
            </tr>
          </tbody>
        </table>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: customStyles.textSecondary }}>This Over:</span>
            <div className="flex items-center">
              <BallDot type="dot">●</BallDot>
              <BallDot type="run-4">4</BallDot>
              <BallDot type="wicket">W</BallDot>
              <BallDot type="run-6">6</BallDot>
              <BallDot type="run-1">1</BallDot>
              <BallDot type="dot">●</BallDot>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[13px]">
            <div>
              <span className="block text-[10px] font-bold uppercase" style={{ color: customStyles.textTertiary }}>Bowler</span>
              <span className="text-white font-medium">M. Siraj</span>
              <span className="ml-1" style={{ color: customStyles.textSecondary, fontFamily: "'Roboto Mono', monospace" }}>2-28 (3.4)</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-3 flex items-center justify-between" style={{ background: customStyles.bgSecondary, borderTop: `1px solid ${customStyles.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-sm" style={{ background: customStyles.teamRcb }} />
          <div>
            <h3 className="text-white text-[14px] font-bold">ROYAL CHALLENGERS</h3>
            <div className="flex items-center gap-2 text-[12px]" style={{ color: customStyles.textSecondary }}>
              <span>Target: <span className="text-white font-bold" style={{ fontFamily: "'Roboto Mono', monospace" }}>189</span></span>
              <span className="w-1 h-1 rounded-full" style={{ background: '#334155' }} />
              <span className="font-medium" style={{ color: customStyles.danger }}>Need 2 from 17 balls</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-[10px] font-bold uppercase" style={{ color: customStyles.textTertiary }}>Required RR</div>
            <div className="font-bold text-[14px]" style={{ color: customStyles.danger, fontFamily: "'Roboto Mono', monospace" }}>0.71</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MatchPage = () => {
  const [activeTab, setActiveTab] = useState('Markets');
  const [activeInnings, setActiveInnings] = useState('2nd');
  const tabs = ['Markets', 'Scorecard', 'Commentary', 'H2H'];

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative" style={{ background: customStyles.bgPrimary }}>
      <header className="h-16 shrink-0 px-8 flex items-center justify-between z-10" style={{ borderBottom: `1px solid ${customStyles.border}`, background: 'rgba(11,14,26,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-[18px] font-bold text-white tracking-tight flex items-center gap-2">
            <span style={{ color: '#3B82F6' }}>🏏</span> IPL 2026 — Qualifier 1
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: customStyles.surface, color: customStyles.textSecondary, border: `1px solid ${customStyles.border}` }}>T20</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: customStyles.surface, border: `1px solid ${customStyles.border}` }}>
            <PulsingDot />
            <span className="font-bold text-[12px] uppercase tracking-wider" style={{ color: customStyles.danger }}>LIVE</span>
            <span className="font-mono text-[13px] pl-2 ml-1 text-white" style={{ borderLeft: '1px solid #334155', fontFamily: "'Roboto Mono', monospace" }}>Over 32.4</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <Scorecard />

        <div className="px-6 mb-4">
          <div className="flex items-center justify-between" style={{ borderBottom: `1px solid ${customStyles.border}` }}>
            <div className="flex items-center gap-6">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="py-3 px-1 text-[14px] transition-colors"
                  style={{
                    color: activeTab === tab ? customStyles.accent : customStyles.textSecondary,
                    fontWeight: activeTab === tab ? '700' : '500',
                    borderBottom: activeTab === tab ? `2px solid ${customStyles.accent}` : '2px solid transparent',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 p-1 rounded-lg" style={{ background: customStyles.bgSecondary, border: `1px solid ${customStyles.border}` }}>
              <button
                onClick={() => setActiveInnings('1st')}
                className="px-3 py-1 text-[11px] font-medium transition-colors"
                style={{ color: activeInnings === '1st' ? customStyles.bgPrimary : customStyles.textSecondary, background: activeInnings === '1st' ? customStyles.accent : 'transparent', borderRadius: '4px' }}
              >
                1st Innings
              </button>
              <button
                onClick={() => setActiveInnings('2nd')}
                className="px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors"
                style={{ color: activeInnings === '2nd' ? customStyles.bgPrimary : customStyles.textSecondary, background: activeInnings === '2nd' ? customStyles.accent : 'transparent', borderRadius: '4px' }}
              >
                2nd Innings <span className="animate-pulse">▶</span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'Markets' && (
          <>
            <div className="px-6 mb-6">
              <div className="rounded-lg p-3 grid grid-cols-4 gap-4 text-center" style={{ background: customStyles.surface, border: `1px solid ${customStyles.border}` }}>
                {[
                  { label: 'Wickets', value: '4', color: 'white' },
                  { label: 'Extras', value: '12', color: 'white' },
                  { label: "Highest P'ship", value: '67', color: customStyles.accent },
                  { label: 'Run Rate', value: '8.42', color: 'white' },
                ].map((item, i) => (
                  <div key={i} className={i < 3 ? 'border-r' : ''} style={{ borderColor: customStyles.border }}>
                    <div className="text-[10px] uppercase font-bold" style={{ color: customStyles.textTertiary }}>{item.label}</div>
                    <div className="font-bold text-[16px]" style={{ color: item.color, fontFamily: "'Roboto Mono', monospace" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pb-12 grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-6 space-y-4">
                <MarketCard title="Match Winner">
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <OddsButton label="Mumbai Indians" odds="1.08" />
                    <OddsButton label="Royal Challengers" odds="8.50" />
                  </div>
                </MarketCard>

                <MarketCard title="Total Runs">
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <OddsButton label="Over 187.5" odds="1.95" />
                      <OddsButton label="Under 187.5" odds="1.85" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <OddsButton label="Over 192.5" odds="2.20" />
                      <OddsButton label="Under 192.5" odds="1.65" />
                    </div>
                  </div>
                </MarketCard>

                <MarketCard title="Top Runscorer">
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <OddsButton label="Rohit Sharma" odds="2.20" />
                    <OddsButton label="Hardik Pandya" odds="4.50" />
                    <OddsButton label="KL Rahul" odds="5.00" />
                    <OddsButton label="Suryakumar" odds="6.00" />
                  </div>
                </MarketCard>

                <MarketCard title="Innings Runs Bands" defaultOpen={false}>
                  <div className="p-4 grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between text-[13px] px-2" style={{ color: customStyles.textSecondary }}>
                      <span>6-10 Overs Runs</span>
                      <span className="font-bold" style={{ color: customStyles.amber, fontFamily: "'Roboto Mono', monospace" }}>Over 38.5 @ 1.83</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] px-2" style={{ color: customStyles.textSecondary }}>
                      <span>Last 5 Overs</span>
                      <span className="font-bold" style={{ color: customStyles.amber, fontFamily: "'Roboto Mono', monospace" }}>Over 55.5 @ 1.90</span>
                    </div>
                  </div>
                </MarketCard>
              </div>

              <div className="col-span-12 lg:col-span-6 space-y-4">
                <MarketCard title="Next Wicket Method">
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-3">
                      <OddsButton label="Caught" odds="2.50" column />
                      <OddsButton label="Bowled" odds="4.00" column />
                      <OddsButton label="LBW" odds="6.00" column />
                      <OddsButton label="Run Out" odds="8.00" column />
                      <div className="col-span-2">
                        <OddsButton label="Others" odds="12.00" column fullWidth />
                      </div>
                    </div>
                  </div>
                </MarketCard>

                <MarketCard title="Top Wicket Taker">
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <OddsButton label="J. Bumrah" odds="2.50" />
                    <OddsButton label="M. Siraj" odds="4.00" />
                    <OddsButton label="J. Hazlewood" odds="5.00" />
                    <OddsButton label="Y. Chahal" odds="6.00" />
                  </div>
                </MarketCard>

                <MarketCard title="Player Milestones">
                  <div className="p-4 space-y-3">
                    <OddsButton label="Rohit Sharma 50+ Runs" odds="1.45" fullWidth />
                    <OddsButton label="Rohit Sharma 100+ Runs" odds="3.50" fullWidth />
                    <OddsButton label="Hardik Pandya 50+ Runs" odds="4.00" fullWidth />
                  </div>
                </MarketCard>

                <MarketCard title="Fall of Next Wicket">
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <OddsButton label="Under 200 Runs" odds="1.85" />
                    <OddsButton label="Over 200 Runs" odds="1.95" />
                  </div>
                </MarketCard>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Scorecard' && (
          <div className="px-6 pb-12">
            <div className="rounded-lg p-6" style={{ background: customStyles.surface, border: `1px solid ${customStyles.border}` }}>
              <p className="text-white font-bold text-[16px] mb-4">Full Scorecard</p>
              <p className="text-[14px]" style={{ color: customStyles.textSecondary }}>Mumbai Indians: 187/4 (32.4 overs)</p>
              <p className="text-[14px] mt-2" style={{ color: customStyles.textSecondary }}>Royal Challengers: Target 189, Need 2 from 17 balls</p>
            </div>
          </div>
        )}

        {activeTab === 'Commentary' && (
          <div className="px-6 pb-12 space-y-3">
            {[
              { over: '32.4', text: 'Rohit hits a dot ball. Just 2 needed off 17 balls!', type: 'dot' },
              { over: '32.3', text: 'SIX! Rohit Sharma launches it over mid-wicket!', type: 'six' },
              { over: '32.2', text: 'WICKET! Suryakumar caught at mid-on. MI 4 down.', type: 'wicket' },
              { over: '32.1', text: 'FOUR! Driven beautifully through covers by Rohit.', type: 'four' },
            ].map((item, i) => (
              <div key={i} className="rounded-lg p-4 flex gap-4" style={{ background: customStyles.surface, border: `1px solid ${customStyles.border}` }}>
                <span className="font-bold text-[13px] shrink-0" style={{ color: customStyles.accent, fontFamily: "'Roboto Mono', monospace" }}>{item.over}</span>
                <p className="text-[14px]" style={{ color: customStyles.textSecondary }}>{item.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'H2H' && (
          <div className="px-6 pb-12">
            <div className="rounded-lg p-6" style={{ background: customStyles.surface, border: `1px solid ${customStyles.border}` }}>
              <p className="text-white font-bold text-[16px] mb-4">Head to Head</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[28px] font-bold text-white" style={{ fontFamily: "'Roboto Mono', monospace" }}>18</p>
                  <p className="text-[12px]" style={{ color: '#3B82F6' }}>Mumbai Indians</p>
                </div>
                <div>
                  <p className="text-[14px] font-bold mt-4" style={{ color: customStyles.textSecondary }}>Matches: 32</p>
                </div>
                <div>
                  <p className="text-[28px] font-bold text-white" style={{ fontFamily: "'Roboto Mono', monospace" }}>14</p>
                  <p className="text-[12px]" style={{ color: '#EC1C24' }}>Royal Challengers</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

const PulsingDot = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
      .pulsing-dot { animation: pulse-red 2s infinite; }
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap');
      * { font-family: 'Inter', sans-serif; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #0B0E1A; }
      ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #64748B; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return <div className="w-2 h-2 rounded-full pulsing-dot" style={{ background: customStyles.danger }} />;
};

const App = () => {
  return (
    <Router basename="/">
      <div
        className="h-screen flex overflow-hidden"
        style={{
          background: customStyles.bgPrimary,
          color: customStyles.textPrimary,
          fontFamily: "'Inter', sans-serif",
          userSelect: 'none',
        }}
      >
        <Sidebar />
        <Routes>
          <Route path="/" element={<MatchPage />} />
        </Routes>
        <BetSlip />
      </div>
    </Router>
  );
};

export default App;