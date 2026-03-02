import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useCredits } from '@/contexts/CreditsContext';

const Sidebar = () => {
  const { pathname } = useLocation();
  const linkClass = (href) => `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === href || (href === '/sports' ? pathname.startsWith('/sports') : pathname.startsWith(href)) ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`;

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
        <Link to="/sports" className={linkClass('/sports')} style={{ textDecoration: 'none' }}><span className="font-medium text-[14px]">Home</span></Link>
        <Link to="/in-play" className={linkClass('/in-play')} style={{ textDecoration: 'none' }}><span className="font-medium text-[14px]">In-Play</span></Link>
        <Link to="/results" className={linkClass('/results')} style={{ textDecoration: 'none' }}><span className="font-medium text-[14px]">Results</span></Link>
        <Link to="/my-bets" className={linkClass('/my-bets')} style={{ textDecoration: 'none' }}><span className="font-medium text-[14px]">My Bets</span></Link>

        <div className="my-4 border-t border-[#1E293B]" />

        <Link to="/account" className={linkClass('/account')} style={{ textDecoration: 'none' }}><span className="font-medium text-[14px]">Account</span></Link>
      </nav>
    </aside>
  );
};

const ResultsPage = () => {
  const { balance, isLoading: balanceLoading, formatBalance } = useCredits();
  const navTabsWithHref = [
    { label: 'Home', href: '/sports' },
    { label: 'In-Play', href: '/in-play' },
    { label: 'Results', href: '/results' },
    { label: 'My Bets', href: '/my-bets' },
    { label: 'Account', href: '/account' },
  ];
  const { pathname } = useLocation();

  const rows = [
    { league: 'Premier League', match: 'Arsenal 2 - 1 Chelsea', status: 'FT', market: 'Match Winner', result: 'Home', settled: 'Won' },
    { league: 'La Liga', match: 'Barcelona 1 - 1 Atletico', status: 'FT', market: 'Under 2.5', result: 'Push', settled: 'Void' },
    { league: 'NBA', match: 'Lakers 101 - 98 Warriors', status: 'FT', market: 'Lakers ML', result: 'Home', settled: 'Won' },
    { league: 'ATP', match: 'Djokovic 2 - 1 Alcaraz', status: 'FT', market: 'Match Winner', result: 'Home', settled: 'Won' },
    { league: 'UCL', match: 'PSG 0 - 2 Bayern', status: 'FT', market: 'Away Win', result: 'Away', settled: 'Lost' },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0B0E1A]">
      <header className="h-16 shrink-0 px-6 flex items-center justify-between border-b border-[#1E293B] bg-[#0B0E1A]/90 backdrop-blur z-10">
        <nav className="flex gap-1">
          {navTabsWithHref.map(({ label, href }) => {
            const active = pathname === href || (href === '/sports' ? pathname.startsWith('/sports') : pathname.startsWith(href));
            return (
              <Link
                key={href}
                to={href}
                className={`px-4 py-2 text-[14px] rounded transition-colors ${active ? 'font-medium text-[#F1F5F9] bg-[#1A2235]' : 'font-medium text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'}`}
                style={{ textDecoration: 'none' }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="bg-[#0B0E1A] border border-[#1E293B] px-3 py-1.5 rounded-[20px] font-mono font-bold text-[#00C37B] text-[13px]">{balanceLoading ? '...' : formatBalance()}</div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] border-2 border-[#1A2235]" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white text-[24px] font-bold tracking-tight">Results</h1>
          <p className="text-[#94A3B8] mt-1 mb-4">Recently settled markets and final outcomes.</p>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4"><div className="text-[#64748B] text-xs uppercase">Settled Today</div><div className="text-white text-2xl font-bold mt-1">24</div></div>
            <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4"><div className="text-[#64748B] text-xs uppercase">Winning Settles</div><div className="text-[#00C37B] text-2xl font-bold mt-1">16</div></div>
            <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4"><div className="text-[#64748B] text-xs uppercase">Net P&L</div><div className="text-[#F59E0B] text-2xl font-bold mt-1">+125.50 CR</div></div>
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-3 px-4 py-3 border-b border-[#1E293B] text-[#64748B] text-[12px] font-semibold uppercase">
              <div>League</div><div className="col-span-2">Match</div><div>Status</div><div>Market</div><div>Settlement</div>
            </div>
            {rows.map((r) => (
              <div key={r.match} className="grid grid-cols-6 gap-3 px-4 py-3 border-b last:border-b-0 border-[#1E293B] text-[13px]">
                <div className="text-[#94A3B8]">{r.league}</div>
                <div className="col-span-2 text-white font-medium">{r.match}</div>
                <div className="text-[#94A3B8] font-mono">{r.status}</div>
                <div className="text-[#94A3B8]">{r.market}</div>
                <div className={r.settled === 'Won' ? 'text-[#00C37B] font-bold' : r.settled === 'Lost' ? 'text-[#EF4444] font-bold' : 'text-[#F59E0B] font-bold'}>{r.settled}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

const App = () => {
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'radial-gradient(circle at top center, #1a2235 0%, #0B0E1A 60%)', color: '#F1F5F9', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <ResultsPage />
    </div>
  );
};

export default App;
