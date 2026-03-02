import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useCredits } from '@/contexts/CreditsContext';

const customStyles = {
  cardGlowGreen: {
    transition: 'all 0.2s ease',
  },
  cardGlowBlue: {
    transition: 'all 0.2s ease',
  },
  actionTile: {
    transition: 'all 0.2s ease',
  },
  progressBar: {
    background: '#1E293B',
    borderRadius: '999px',
    height: '6px',
    width: '100%',
    overflow: 'hidden',
  },
  progressValue: {
    background: '#00C37B',
    height: '100%',
    borderRadius: '999px',
  },
  donutRing: {
    stroke: '#1E293B',
  },
  donutSegment: {
    stroke: '#00C37B',
    strokeLinecap: 'round',
    transition: 'stroke-dasharray 0.5s ease',
  },
  statBar: {
    width: '6px',
    borderRadius: '2px',
    transition: 'height 0.3s ease',
  },
};

const Sidebar = ({ balance }) => {
  const { pathname } = useLocation();
  return (
    <aside className="w-[240px] bg-[#111827] border-r border-[#1E293B] flex flex-col shrink-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-[#1E293B]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B] mr-2">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
        </svg>
        <div className="text-[20px] font-extrabold tracking-tight text-white">
          BET<span className="text-[#00C37B]">ARENA</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        <Link to="/sports" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/sports' || pathname.startsWith('/sports/') ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="font-medium text-[14px]">Sports</span>
        </Link>

        <Link to="/in-play" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/in-play' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-medium text-[14px]">In-Play</span>
        </Link>

        <Link to="/my-bets" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/my-bets' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className="font-medium text-[14px]">My Bets</span>
        </Link>

        <Link to="/results" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/results' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span className="font-medium text-[14px]">Results</span>
        </Link>

        <div className="my-4 border-t border-[#1E293B]"></div>

        <Link to="/account" className={`flex items-center gap-3 px-3 py-2.5 rounded-r-md border-l-[3px] transition-colors relative ${pathname === '/account' ? 'bg-[#1A2235] text-white border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white border-transparent'}`} style={{ textDecoration: 'none' }}>
          <div className="absolute inset-0 bg-[#00C37B] opacity-5 rounded-md pointer-events-none"></div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#00C37B]">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className={`text-[14px] ${pathname === '/account' ? 'font-bold' : 'font-medium'}`}>My Account</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#00C37B] border border-[#1E293B] flex items-center justify-center text-[#0B0E1A] font-bold text-sm">JK</div>
          <div className="flex flex-col">
            <span className="text-white text-[13px] font-bold">John K.</span>
            <span className="text-[#00C37B] text-[11px] font-mono">{balance !== undefined ? `${balance.toFixed(2)} CR` : '...'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const CreditBalanceCard = ({ balance = 0, isLoading = false }) => {
  const [hovered, setHovered] = useState(false);
  const fmt = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  return (
    <div
      className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 transition-all relative overflow-hidden group"
      style={hovered ? { boxShadow: '0 0 20px rgba(0,195,123,0.2)', borderColor: 'rgba(0,195,123,0.4)' } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C37B] opacity-5 rounded-bl-full pointer-events-none group-hover:opacity-10 transition-opacity"></div>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[#94A3B8] text-[13px] font-bold uppercase tracking-wider">Credit Balance</h3>
        <div className="w-8 h-8 rounded-full bg-[rgba(0,195,123,0.1)] flex items-center justify-center text-[#00C37B]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
      </div>

      <div className="mb-4">
        <div className="font-mono text-[32px] font-bold text-[#00C37B] leading-none mb-2">
          {isLoading ? '...' : fmt(balance)} <span className="text-[16px] text-[#00C37B] opacity-60">CR</span>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-[#1E293B]">
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-[#94A3B8]">Available Now</span>
          <span className="text-[#00C37B] font-mono font-bold">{isLoading ? '...' : `${fmt(balance)} CR`}</span>
        </div>
      </div>
    </div>
  );
};

const TotalBetsCard = () => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 transition-all relative overflow-hidden group"
      style={hovered ? { boxShadow: '0 0 20px rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.4)' } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6] opacity-5 rounded-bl-full pointer-events-none group-hover:opacity-10 transition-opacity"></div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[#94A3B8] text-[13px] font-bold uppercase tracking-wider">Total Bets</h3>
        <div className="w-8 h-8 rounded-full bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[#3B82F6]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M2 12h20" />
            <path d="M2 12l10-10 10 10-10 10-10-10z" />
          </svg>
        </div>
      </div>

      <div className="font-mono text-[32px] font-bold text-white leading-none mb-4">47</div>

      <div className="flex h-2 w-full rounded-full overflow-hidden mb-6">
        <div className="h-full bg-[#00C37B]" style={{ width: '60%' }} title="Won 28"></div>
        <div className="h-full bg-[#EF4444]" style={{ width: '34%' }} title="Lost 16"></div>
        <div className="h-full bg-[#F59E0B]" style={{ width: '6%' }} title="Open 3"></div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
            <circle style={customStyles.donutRing} cx="48" cy="48" r="40" strokeWidth="8" fill="transparent" />
            <circle
              style={customStyles.donutSegment}
              cx="48"
              cy="48"
              r="40"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset="100.48"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] text-[#94A3B8] uppercase font-bold">Win Rate</span>
            <span className="text-[14px] text-white font-bold">59.6%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-[#1E293B]">
        <span className="text-[#94A3B8] text-[13px]">Biggest Win</span>
        <span className="text-[#00C37B] font-mono font-bold">+125.00 CR</span>
      </div>
    </div>
  );
};

const PLCard = () => {
  const [hovered, setHovered] = useState(false);
  const bars = [
    { color: '#00C37B', height: '40%', label: '+20' },
    { color: '#EF4444', height: '25%', label: '-15' },
    { color: '#00C37B', height: '60%', label: '+45' },
    { color: '#00C37B', height: '30%', label: '+10' },
    { color: '#EF4444', height: '20%', label: '-10' },
    { color: '#00C37B', height: '85%', label: '+125' },
    { color: '#EF4444', height: '45%', label: '-35' },
  ];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div
      className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 transition-all relative overflow-hidden group"
      style={hovered ? { boxShadow: '0 0 20px rgba(0,195,123,0.2)', borderColor: 'rgba(0,195,123,0.4)' } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C37B] opacity-5 rounded-bl-full pointer-events-none group-hover:opacity-10 transition-opacity"></div>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[#94A3B8] text-[13px] font-bold uppercase tracking-wider">My P&L</h3>
        <div className="w-8 h-8 rounded-full bg-[rgba(0,195,123,0.1)] flex items-center justify-center text-[#00C37B]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
      </div>

      <div className="mb-8">
        <div className="font-mono text-[32px] font-bold text-[#00C37B] leading-none">
          +125.50 <span className="text-[16px] text-[#00C37B] opacity-60">CR</span>
        </div>
        <div className="text-[12px] text-[#94A3B8] mt-1">Last 7 Days</div>
      </div>

      <div className="flex items-end justify-between h-24 gap-2 mb-2">
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{ ...customStyles.statBar, height: bar.height, backgroundColor: bar.color }}
            title={bar.label}
          ></div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[#64748B] font-mono border-t border-[#1E293B] pt-2">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
    </div>
  );
};

const ActionTile = ({ icon, title, subtitle, href = '#' }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={href}
      className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 flex items-center gap-4 group"
      style={
        hovered
          ? { transform: 'translateY(-2px)', backgroundColor: '#232d42', borderColor: '#94A3B8', transition: 'all 0.2s ease' }
          : { transition: 'all 0.2s ease' }
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-10 h-10 rounded-lg bg-[#111827] flex items-center justify-center text-[#94A3B8] group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-white font-bold text-[14px]">{title}</span>
        <span className="text-[#64748B] text-[12px]">{subtitle}</span>
      </div>
    </Link>
  );
};

const TransactionRow = ({ iconBg, iconColor, icon, title, subtitle, amount, amountColor, balance, time }) => {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-[#232d42] transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
        <div>
          <div className="text-white font-bold text-[14px]">{title}</div>
          <div className="text-[#64748B] text-[12px]">{subtitle}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono font-bold text-[14px]" style={{ color: amountColor }}>{amount}</div>
        <div className="text-[#64748B] font-mono text-[12px] flex items-center justify-end gap-2">
          <span>Bal: {balance}</span>
          <span className="text-[#334155]">•</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

const MyAccountPage = () => {
  const { balance, isLoading: balanceLoading, formatBalance, fetchTransactions, isAuthenticated } = useCredits();
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setTxLoading(false); return; }
    let cancelled = false;
    fetchTransactions(1, 5).then(data => {
      if (!cancelled) { setTransactions(data.transactions || []); setTxLoading(false); }
    });
    return () => { cancelled = true; };
  }, [fetchTransactions, isAuthenticated]);

  const navTabsWithHref = [
    { label: 'Home', href: '/sports' },
    { label: 'In-Play', href: '/in-play' },
    { label: 'Results', href: '/results' },
    { label: 'My Bets', href: '/my-bets' },
    { label: 'Account', href: '/account' },
  ];
  const { pathname } = useLocation();

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0B0E1A]">
      <header className="h-16 shrink-0 px-6 flex items-center justify-between border-b border-[#1E293B] bg-[#0B0E1A] z-10 sticky top-0" style={{ backdropFilter: 'blur(8px)' }}>
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
        <div className="flex items-center gap-4">
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Profile Section */}
          <section className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C37B] opacity-[0.03] rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>

            <div className="relative shrink-0">
              <div
                className="w-24 h-24 rounded-full bg-[#00C37B] flex items-center justify-center text-[#0B0E1A] text-[32px] font-bold border-4 border-[#1A2235]"
                style={{ boxShadow: '0 0 0 2px #00C37B' }}
              >JK</div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#00C37B] rounded-full border-2 border-[#1A2235] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0B0E1A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-[24px] font-bold text-white">John K.</h2>
                <span className="bg-[rgba(0,195,123,0.1)] text-[#00C37B] border border-[rgba(0,195,123,0.2)] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Member ID: 20_1
                </span>
              </div>
              <div className="text-[#94A3B8] text-[14px] flex flex-col md:flex-row gap-4 mb-1">
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Agent: <span className="text-white">Agent_20</span>
                </span>
                <span className="hidden md:inline text-[#334155]">|</span>
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Member since: <span className="text-white">Jan 2026</span>
                </span>
              </div>
              <div className="text-[#64748B] text-[12px] flex items-center gap-2 mt-2 md:mt-0 justify-center md:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C37B]"></div>
                Last login: Today 14:23
              </div>
            </div>
          </section>

          {/* Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CreditBalanceCard balance={balance} isLoading={balanceLoading} />
            <TotalBetsCard />
            <PLCard />
          </section>

          {/* Action Tiles */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ActionTile
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              }
              title="My Bets"
              subtitle="View history"
              href="/my-bets"
            />
            <ActionTile
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              }
              title="Transactions"
              subtitle="Deposits & Wins"
              href="/account/transactions"
            />
            <ActionTile
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              }
              title="Notifications"
              subtitle="3 New alerts"
            />
            <ActionTile
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              }
              title="Settings"
              subtitle="Preferences"
              href="/account/settings"
            />
            <ActionTile
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              title="Help & FAQ"
              subtitle="Support center"
            />
            <ActionTile
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
              title="Security"
              subtitle="Password & 2FA"
              href="/account/settings"
            />
          </section>

          {/* Recent Transactions */}
          <section className="bg-[#1A2235] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex justify-between items-center">
              <h3 className="text-white font-bold text-[16px]">Recent Transactions</h3>
              <Link to="/account/transactions" className="text-[#00C37B] text-[13px] font-bold hover:underline" style={{ textDecoration: 'none' }}>View All →</Link>
            </div>

            <div className="divide-y divide-[#1E293B]">
              {txLoading ? (
                <div className="px-6 py-8 text-center text-[#64748B] text-[13px]">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="px-6 py-8 text-center text-[#64748B] text-[13px]">No transactions yet</div>
              ) : (
                transactions.map((tx) => {
                  const isCredit = tx.type === 'transfer' || tx.type === 'create';
                  const isDeduct = tx.type === 'deduct';
                  const amt = parseFloat(tx.amount) || 0;
                  const timeStr = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <TransactionRow
                      key={tx.id}
                      iconBg={isDeduct ? 'rgba(239,68,68,0.1)' : 'rgba(0,195,123,0.1)'}
                      iconColor={isDeduct ? '#EF4444' : '#00C37B'}
                      icon={
                        isDeduct ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                        )
                      }
                      title={tx.note || (isDeduct ? 'Bet Placed' : 'Credit Received')}
                      subtitle={tx.type === 'transfer' ? 'Transfer' : tx.type === 'create' ? 'Admin Credit' : tx.type === 'deduct' ? 'Bet Deduction' : tx.type}
                      amount={`${isDeduct ? '-' : '+'}${amt.toFixed(2)} CR`}
                      amountColor={isDeduct ? '#EF4444' : '#00C37B'}
                      balance=""
                      time={timeStr}
                    />
                  );
                })
              )}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
};

const App = () => {
  const { balance } = useCredits();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      body { margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #0B0E1A; }
      ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #64748B; }
      * { box-sizing: border-box; }
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; background-color: #0B0E1A; color: #F1F5F9; }
      .font-mono { font-family: 'Roboto Mono', monospace; }
      ::selection { background-color: #00C37B; color: black; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'radial-gradient(circle at top center, #1a2235 0%, #0B0E1A 60%)', color: '#F1F5F9' }}>
      <Sidebar balance={balance} />
      <MyAccountPage />
    </div>
  );
};

export default App;
