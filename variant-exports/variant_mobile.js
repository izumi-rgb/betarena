import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

const customStyles = {
  pulsingDot: {
    animation: 'pulse-red 2s infinite',
  },
  phoneFrame: {
    width: '375px',
    height: '812px',
    backgroundColor: '#0B0E1A',
    borderRadius: '40px',
    border: '8px solid #1f2937',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    flexShrink: 0,
  },
  oddsBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #1E293B',
    transition: 'all 0.2s',
  },
};

const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background-color: #0f172a; font-family: 'Inter', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .font-mono-custom { font-family: 'Roboto Mono', monospace; }
      @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
      .pulsing-dot { animation: pulse-red 2s infinite; }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      .animate-pulse-custom { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      .odds-btn { background: rgba(255,255,255,0.05); border: 1px solid #1E293B; transition: all 0.2s; }
      .odds-btn:active { background: #232d42; transform: scale(0.98); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

const BetArenaLogo = () => (
  <div className="flex items-center gap-1">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
      <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
    </svg>
    <span className="font-bold text-white text-lg tracking-tight">BETARENA</span>
  </div>
);

const NavBar = ({ activePage, onNavigate }) => {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" style={{ strokeWidth: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'live',
      label: 'In-Play',
      icon: (
        <svg className="w-5 h-5" style={{ strokeWidth: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'sports',
      label: 'Results',
      icon: (
        <svg className="w-5 h-5" style={{ strokeWidth: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'bets',
      label: 'My Bets',
      icon: (
        <svg className="w-5 h-5" style={{ strokeWidth: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg className="w-5 h-5" style={{ strokeWidth: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="h-16 bg-[#111827] border-t border-[#1E293B] shrink-0 grid grid-cols-5 items-center px-2 z-20">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center gap-1 ${activePage === item.id ? 'text-[#00C37B]' : 'text-[#64748B]'}`}
        >
          {item.icon}
          <span className={`text-[9px] ${activePage === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

const HomePage = ({ onNavigate, onOpenBetSlip, betSlipCount }) => {
  const [activeFilter, setActiveFilter] = useState('live');
  const [selectedOdds, setSelectedOdds] = useState({});

  const filters = [
    { id: 'live', label: '⚡ Live 89' },
    { id: 'football', label: '⚽ Football' },
    { id: 'tennis', label: '🎾 Tennis' },
    { id: 'nba', label: '🏀 NBA' },
    { id: 'cricket', label: '🏏 Cricket' },
  ];

  const handleOddsClick = (matchId, market) => {
    setSelectedOdds((prev) => ({
      ...prev,
      [`${matchId}-${market}`]: !prev[`${matchId}-${market}`],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#1E293B] shrink-0 bg-[#0B0E1A] z-20">
        <BetArenaLogo />
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-full px-3 py-1 flex items-center gap-1">
            <span className="text-[#00C37B] font-mono text-xs font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>450 CR</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-white/10"></div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b border-[#1E293B]/50">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
                activeFilter === filter.id
                  ? 'bg-[#00C37B] text-[#0B0E1A] font-bold'
                  : 'bg-[#1A2235] text-[#94A3B8] border border-[#1E293B]'
              }`}
            >
              {filter.id === 'live' && <span className="animate-pulse-custom">⚡</span>}
              {filter.label}
            </button>
          ))}
        </div>

        <div className="px-4 mb-4 mt-4">
          <div className="bg-[#1A2235] border border-[#1E293B] border-l-[3px] border-l-[#F59E0B] rounded-lg p-3 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[#F59E0B] text-xs font-bold uppercase tracking-wider">In-Play Action</span>
              <span className="text-white font-bold text-sm">⚡ 247 Events Live Now</span>
            </div>
            <button onClick={() => onNavigate('live')} className="text-[#94A3B8] text-xs font-medium">See all →</button>
          </div>
        </div>

        <div className="px-4 space-y-4 pb-24">
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] pulsing-dot"></div>
                <span className="text-[#EF4444] text-[10px] font-bold uppercase">LIVE 67'</span>
                <span className="text-[#64748B] text-[10px]">Premier League</span>
              </div>
              <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold">A</div>
                <span className="font-bold text-sm">Arsenal</span>
              </div>
              <div className="bg-[#0B0E1A] px-3 py-1 rounded border border-[#1E293B] font-bold text-white" style={{ fontFamily: 'Roboto Mono, monospace' }}>2 - 1</div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-right">Chelsea</span>
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">C</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[{ label: 'Arsenal', odds: '1.45' }, { label: 'Draw', odds: '4.20' }, { label: 'Chelsea', odds: '7.50' }].map((o) => (
                <button
                  key={o.label}
                  onClick={() => handleOddsClick('arsenal-chelsea', o.label)}
                  className={`odds-btn rounded-lg py-2 flex flex-col items-center ${selectedOdds[`arsenal-chelsea-${o.label}`] ? 'border-[#00C37B] bg-[#00C37B]/10' : ''}`}
                >
                  <span className="text-[#64748B] text-[9px] uppercase font-bold">{o.label}</span>
                  <span className="text-[#F59E0B] text-sm font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>{o.odds}</span>
                </button>
              ))}
            </div>
            <div className="text-right mt-2">
              <span className="text-[#64748B] text-[10px] font-medium">+142 markets →</span>
            </div>
          </div>

          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#94A3B8] text-[10px] font-bold">Sat 15:00</span>
                <span className="text-[#64748B] text-[10px]">Premier League</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sm">Man City</span>
              <span className="text-[#64748B] text-xs font-bold">VS</span>
              <span className="font-bold text-sm text-right">Liverpool</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: '1', odds: '2.10' }, { label: 'X', odds: '3.30' }, { label: '2', odds: '3.50' }].map((o) => (
                <button
                  key={o.label}
                  onClick={() => handleOddsClick('city-liverpool', o.label)}
                  className={`odds-btn rounded-lg py-2 flex flex-col items-center ${selectedOdds[`city-liverpool-${o.label}`] ? 'border-[#00C37B] bg-[#00C37B]/10' : ''}`}
                >
                  <span className="text-[#64748B] text-[9px] uppercase font-bold">{o.label}</span>
                  <span className="text-[#F59E0B] text-sm font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>{o.odds}</span>
                </button>
              ))}
            </div>
            <div className="text-right mt-2">
              <span className="text-[#64748B] text-[10px] font-medium">+156 markets →</span>
            </div>
          </div>

          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] pulsing-dot"></div>
                <span className="text-[#EF4444] text-[10px] font-bold uppercase">LIVE 3rd Set</span>
                <span className="text-[#64748B] text-[10px]">Wimbledon</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sm">Djokovic</span>
              <span className="text-[#64748B] text-xs font-bold">VS</span>
              <span className="font-bold text-sm text-right">Alcaraz</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[{ label: '1', odds: '1.65' }, { label: '2', odds: '2.20' }].map((o) => (
                <button
                  key={o.label}
                  onClick={() => handleOddsClick('djokovic-alcaraz', o.label)}
                  className={`odds-btn rounded-lg py-2 flex flex-col items-center ${selectedOdds[`djokovic-alcaraz-${o.label}`] ? 'border-[#00C37B] bg-[#00C37B]/10' : ''}`}
                >
                  <span className="text-[#64748B] text-[9px] uppercase font-bold">{o.label}</span>
                  <span className="text-[#F59E0B] text-sm font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>{o.odds}</span>
                </button>
              ))}
            </div>
            <div className="text-right mt-2">
              <span className="text-[#64748B] text-[10px] font-medium">+38 markets →</span>
            </div>
          </div>

          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 shadow-lg opacity-50">
            <div className="h-4 bg-gray-700/20 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-gray-700/20 rounded w-full"></div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={onOpenBetSlip}
          className="bg-[#00C37B] hover:bg-[#00a86b] text-[#0B0E1A] px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95"
          style={{ boxShadow: '0 0 20px rgba(0,195,123,0.4)' }}
        >
          <span>🎯</span>
          <span>Bet Slip ({betSlipCount})</span>
        </button>
      </div>
    </div>
  );
};

const BetSlipModal = ({ isOpen, onClose }) => {
  const [betAmount, setBetAmount] = useState('25.00');
  const [activeTab, setActiveTab] = useState('accumulator');
  const [selections, setSelections] = useState([
    { id: 1, name: 'Arsenal to Win', market: 'Match Result · Arsenal vs Chelsea', sport: 'Football', odds: 1.95, trending: true },
    { id: 2, name: 'Over 2.5 Goals', market: 'Total Goals · Man City vs Liverpool', sport: 'Football', odds: 1.85, trending: false },
  ]);

  const removeSelection = (id) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  };

  const combinedOdds = selections.reduce((acc, s) => acc * s.odds, 1).toFixed(2);
  const potentialReturns = (parseFloat(betAmount || 0) * parseFloat(combinedOdds)).toFixed(2);

  const quickAmounts = [5, 10, 25, 50, 100];

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-10">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute bottom-0 left-0 right-0 h-[75%] bg-[#1A2235] rounded-t-[20px] z-20 flex flex-col shadow-2xl border-t border-[#1E293B]">
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
        </div>

        <div className="px-5 py-3 border-b border-[#1E293B] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">Bet Slip</span>
            <span className="bg-[#111827] text-[#94A3B8] text-[10px] px-2 py-0.5 rounded-full font-medium">{selections.length} selections</span>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-red-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {selections.map((sel, idx) => (
            <div key={sel.id} className={`py-4 relative group ${idx < selections.length - 1 ? 'border-b border-[#1E293B]' : ''}`}>
              <button onClick={() => removeSelection(sel.id)} className="absolute top-4 right-0 text-[#64748B] hover:text-white text-lg leading-none">×</button>
              <div className="flex flex-col gap-1 pr-6">
                <span className="text-[#00C37B] font-bold text-sm">{sel.name}</span>
                <span className="text-[#94A3B8] text-xs">{sel.market}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="bg-[#00C37B]/10 text-[#00C37B] text-[10px] px-1.5 py-0.5 rounded font-bold">{sel.sport}</span>
                <span className={`font-bold text-lg flex items-center gap-1 ${sel.trending ? 'text-[#00C37B]' : 'text-[#F59E0B]'}`} style={{ fontFamily: 'Roboto Mono, monospace' }}>
                  {sel.odds.toFixed(2)}
                  {sel.trending && (
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M12 4l-8 8h16l-8-8z" />
                    </svg>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#111827] border-t border-[#1E293B] p-5 pb-8">
          <div className="flex bg-[#0B0E1A] p-1 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab('singles')}
              className={`flex-1 py-1.5 text-xs rounded ${activeTab === 'singles' ? 'font-bold text-[#0B0E1A] bg-[#00C37B] shadow-sm' : 'font-medium text-[#94A3B8]'}`}
            >Singles</button>
            <button
              onClick={() => setActiveTab('accumulator')}
              className={`flex-1 py-1.5 text-xs rounded ${activeTab === 'accumulator' ? 'font-bold text-[#0B0E1A] bg-[#00C37B] shadow-sm' : 'font-medium text-[#94A3B8]'}`}
            >Accumulator</button>
          </div>

          <div className="flex justify-between text-xs text-[#94A3B8] mb-2 px-1">
            <span>Combined Odds</span>
            <span className="font-bold text-[#F59E0B]" style={{ fontFamily: 'Roboto Mono, monospace' }}>{combinedOdds}</span>
          </div>

          <div className="relative mb-3">
            <input
              type="text"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full bg-[#1A2235] border border-[#1E293B] rounded-lg py-3 px-4 text-white font-bold text-lg text-center focus:border-[#00C37B] outline-none"
              style={{ fontFamily: 'Roboto Mono, monospace' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] text-sm" style={{ fontFamily: 'Roboto Mono, monospace' }}>CR</span>
          </div>

          <div className="flex gap-2 justify-between mb-5">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt.toFixed(2))}
                className={`flex-1 rounded py-1.5 text-[10px] font-medium transition-colors ${
                  betAmount === amt.toFixed(2)
                    ? 'bg-[#00C37B]/20 border border-[#00C37B] text-[#00C37B] font-bold'
                    : 'bg-[#1A2235] border border-[#1E293B] text-[#94A3B8] hover:border-[#00C37B]'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-sm font-medium text-[#94A3B8]">Potential Returns</span>
            <span className="text-xl font-bold text-[#00C37B]" style={{ fontFamily: 'Roboto Mono, monospace' }}>{potentialReturns} CR</span>
          </div>

          <button className="w-full bg-[#00C37B] hover:bg-[#00a86b] text-[#0B0E1A] font-bold text-base h-14 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            <span>PLACE BET</span>
            <span className="opacity-60">—</span>
            <span>{betAmount} CR</span>
          </button>

          <div className="text-center mt-3">
            <span className="text-[10px] text-[#64748B]">Balance: 425.00 CR</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LivePage = ({ onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOdds, setSelectedOdds] = useState({});

  const filters = [
    { id: 'all', label: 'All 247' },
    { id: 'football', label: '⚽ Football' },
    { id: 'tennis', label: '🎾 Tennis' },
    { id: 'nba', label: '🏀 NBA' },
  ];

  const handleOddsClick = (matchId, market) => {
    setSelectedOdds((prev) => ({
      ...prev,
      [`${matchId}-${market}`]: !prev[`${matchId}-${market}`],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#1E293B] shrink-0 bg-[#0B0E1A] z-20">
        <BetArenaLogo />
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-white/10"></div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b border-[#1E293B]/50 sticky top-0 bg-[#0B0E1A]/95 backdrop-blur z-10">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-[#00C37B] text-[#0B0E1A] font-bold'
                  : 'bg-[#1A2235] text-[#94A3B8] border border-[#1E293B]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="px-4 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="animate-pulse-custom text-[#EF4444]">⚡</span> Live Now
            <span className="text-[#64748B] text-xs font-normal ml-2">247 events</span>
          </h2>
          <svg className="w-5 h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>

        <div className="space-y-4 px-4 pb-4">
          <div className="bg-[#1A2235] border border-[#1E293B] border-l-[4px] border-l-[#00C37B] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-red-500/20 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse-custom">LIVE</span>
                <span className="text-[#EF4444] text-xs font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>67'</span>
                <span className="text-[#94A3B8] text-[10px]">Premier League</span>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-white text-base font-bold mb-2">Arsenal vs Chelsea</div>
              <div className="font-bold text-white tracking-widest bg-[#0B0E1A] inline-block px-4 py-1 rounded-lg border border-[#1E293B] text-3xl" style={{ fontFamily: 'Roboto Mono, monospace' }}>2 - 1</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['1.45', '4.20', '7.50'].map((odds) => (
                <button
                  key={odds}
                  onClick={() => handleOddsClick('live-arsenal', odds)}
                  className={`bg-[#0B0E1A] border rounded py-2 font-bold text-sm ${selectedOdds[`live-arsenal-${odds}`] ? 'border-[#00C37B] text-[#00C37B]' : 'border-[#1E293B] text-[#F59E0B]'}`}
                  style={{ fontFamily: 'Roboto Mono, monospace' }}
                >
                  {odds}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-4 text-[10px] text-[#64748B] border-t border-[#1E293B] pt-2">
              <span>⚽ Goals: <span className="text-white">3</span></span>
              <span>🟡 Cards: <span className="text-white">1</span></span>
              <span>🚩 Corners: <span className="text-white">7</span></span>
            </div>
          </div>

          <div className="bg-[#1A2235] border border-[#1E293B] border-l-[4px] border-l-[#F59E0B] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-red-500/20 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse-custom">LIVE</span>
                <span className="text-[#EF4444] text-xs font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>3rd Set</span>
                <span className="text-[#94A3B8] text-[10px]">Wimbledon</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm font-medium">
              <div className="flex items-center gap-2 text-white">
                <span>Djokovic</span>
                <div className="w-2 h-2 bg-[#F59E0B] rounded-full"></div>
              </div>
              <span className="text-[#94A3B8]">vs</span>
              <span className="text-white">Alcaraz</span>
            </div>
            <div className="flex justify-center gap-3 mb-4 text-white text-lg" style={{ fontFamily: 'Roboto Mono, monospace' }}>
              <span className="text-[#94A3B8]">6-4</span>
              <span className="text-[#94A3B8]">3-6</span>
              <span className="font-bold text-[#F59E0B]">2-1</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['1.65', '2.20'].map((odds) => (
                <button
                  key={odds}
                  onClick={() => handleOddsClick('live-djokovic', odds)}
                  className={`bg-[#0B0E1A] border rounded py-2 font-bold text-sm ${selectedOdds[`live-djokovic-${odds}`] ? 'border-[#00C37B] text-[#00C37B]' : 'border-[#1E293B] text-[#F59E0B]'}`}
                  style={{ fontFamily: 'Roboto Mono, monospace' }}
                >
                  {odds}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#1A2235] border border-[#1E293B] border-l-[4px] border-l-[#3B82F6] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-red-500/20 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse-custom">LIVE</span>
                <span className="text-[#EF4444] text-xs font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>Q3 8:42</span>
                <span className="text-[#94A3B8] text-[10px]">NBA</span>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-white text-sm font-bold mb-1">Lakers vs Warriors</div>
              <div className="font-bold text-white tracking-widest text-2xl" style={{ fontFamily: 'Roboto Mono, monospace' }}>78 - 71</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOddsClick('live-lakers', 'spread')}
                className={`bg-[#0B0E1A] border rounded py-2 px-3 flex justify-between items-center ${selectedOdds['live-lakers-spread'] ? 'border-[#00C37B]' : 'border-[#1E293B]'}`}
              >
                <span className="text-[#94A3B8] text-[10px]">Lakers -3.5</span>
                <span className="text-[#F59E0B] font-bold text-sm" style={{ fontFamily: 'Roboto Mono, monospace' }}>1.90</span>
              </button>
              <button
                onClick={() => handleOddsClick('live-lakers', 'total')}
                className={`bg-[#0B0E1A] border rounded py-2 px-3 flex justify-between items-center ${selectedOdds['live-lakers-total'] ? 'border-[#00C37B]' : 'border-[#1E293B]'}`}
              >
                <span className="text-[#94A3B8] text-[10px]">Over 210.5</span>
                <span className="text-[#F59E0B] font-bold text-sm" style={{ fontFamily: 'Roboto Mono, monospace' }}>1.85</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SportsPage = ({ onNavigate }) => {
  const sports = [
    { emoji: '⚽', name: 'Football', count: 142 },
    { emoji: '🎾', name: 'Tennis', count: 38 },
    { emoji: '🏀', name: 'Basketball', count: 24 },
    { emoji: '🏏', name: 'Cricket', count: 18 },
    { emoji: '🏒', name: 'Ice Hockey', count: 12 },
    { emoji: '🎱', name: 'Snooker', count: 6 },
    { emoji: '🏈', name: 'American Football', count: 9 },
    { emoji: '⚾', name: 'Baseball', count: 15 },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#1E293B] shrink-0 bg-[#0B0E1A] z-20">
        <BetArenaLogo />
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-white/10"></div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 py-4">
        <h2 className="text-white font-bold text-lg mb-4">All Sports</h2>
        <div className="space-y-2">
          {sports.map((sport) => (
            <button
              key={sport.name}
              className="w-full bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between hover:border-[#00C37B] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{sport.emoji}</span>
                <span className="text-white font-semibold">{sport.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#64748B] text-xs">{sport.count} events</span>
                <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const BetsPage = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('open');

  const openBets = [
    { id: 1, name: 'Arsenal to Win', match: 'Arsenal vs Chelsea', odds: 1.95, stake: 25, status: 'live' },
    { id: 2, name: 'Over 2.5 Goals', match: 'Man City vs Liverpool', odds: 1.85, stake: 10, status: 'pending' },
  ];

  const settledBets = [
    { id: 3, name: 'Djokovic to Win', match: 'Djokovic vs Alcaraz', odds: 1.65, stake: 20, result: 'won', payout: 33 },
    { id: 4, name: 'Lakers -3.5', match: 'Lakers vs Warriors', odds: 1.9, stake: 15, result: 'lost', payout: 0 },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#1E293B] shrink-0 bg-[#0B0E1A] z-20">
        <BetArenaLogo />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-white/10"></div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="flex bg-[#0B0E1A] p-1 rounded-lg m-4">
          <button
            onClick={() => setActiveTab('open')}
            className={`flex-1 py-2 text-xs rounded ${activeTab === 'open' ? 'font-bold text-[#0B0E1A] bg-[#00C37B]' : 'font-medium text-[#94A3B8]'}`}
          >Open Bets</button>
          <button
            onClick={() => setActiveTab('settled')}
            className={`flex-1 py-2 text-xs rounded ${activeTab === 'settled' ? 'font-bold text-[#0B0E1A] bg-[#00C37B]' : 'font-medium text-[#94A3B8]'}`}
          >Settled</button>
        </div>

        <div className="px-4 space-y-3">
          {activeTab === 'open' ? openBets.map((bet) => (
            <div key={bet.id} className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#00C37B] font-bold text-sm">{bet.name}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${bet.status === 'live' ? 'bg-red-500/20 text-red-500' : 'bg-[#94A3B8]/20 text-[#94A3B8]'}`}>
                  {bet.status === 'live' ? '● LIVE' : 'PENDING'}
                </span>
              </div>
              <span className="text-[#94A3B8] text-xs block mb-3">{bet.match}</span>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Odds: <span className="text-[#F59E0B] font-mono font-bold">{bet.odds}</span></span>
                <span className="text-[#64748B]">Stake: <span className="text-white font-mono font-bold">{bet.stake} CR</span></span>
                <span className="text-[#64748B]">Return: <span className="text-[#00C37B] font-mono font-bold">{(bet.odds * bet.stake).toFixed(2)} CR</span></span>
              </div>
            </div>
          )) : settledBets.map((bet) => (
            <div key={bet.id} className={`bg-[#1A2235] border rounded-xl p-4 ${bet.result === 'won' ? 'border-[#00C37B]/30' : 'border-[#EF4444]/30'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-bold text-sm">{bet.name}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${bet.result === 'won' ? 'bg-[#00C37B]/20 text-[#00C37B]' : 'bg-red-500/20 text-red-500'}`}>
                  {bet.result === 'won' ? '✓ WON' : '✗ LOST'}
                </span>
              </div>
              <span className="text-[#94A3B8] text-xs block mb-3">{bet.match}</span>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Stake: <span className="text-white font-mono font-bold">{bet.stake} CR</span></span>
                <span className="text-[#64748B]">Payout: <span className={`font-mono font-bold ${bet.result === 'won' ? 'text-[#00C37B]' : 'text-[#EF4444]'}`}>{bet.payout > 0 ? `+${bet.payout} CR` : '0 CR'}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AccountPage = ({ onNavigate }) => {
  const stats = [
    { label: 'Total Bets', value: '247' },
    { label: 'Win Rate', value: '58%' },
    { label: 'Total Won', value: '1,240 CR' },
    { label: 'Biggest Win', value: '340 CR' },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#1E293B] shrink-0 bg-[#0B0E1A] z-20">
        <BetArenaLogo />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-white/10"></div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4">
        <div className="py-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-[#00C37B] mb-3"></div>
          <span className="text-white font-bold text-xl">John Doe</span>
          <span className="text-[#94A3B8] text-sm">@johndoe</span>
          <div className="mt-4 bg-[#1A2235] border border-[#1E293B] rounded-full px-5 py-2">
            <span className="text-[#00C37B] font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>Balance: 450.00 CR</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 text-center">
              <div className="text-[#00C37B] font-bold text-lg" style={{ fontFamily: 'Roboto Mono, monospace' }}>{stat.value}</div>
              <div className="text-[#94A3B8] text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {['Deposit / Withdraw', 'Betting History', 'Promotions', 'Settings', 'Help & Support', 'Log Out'].map((item) => (
            <button
              key={item}
              className={`w-full bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between hover:border-[#00C37B] transition-colors ${item === 'Log Out' ? 'text-red-500' : 'text-white'}`}
            >
              <span className="font-medium text-sm">{item}</span>
              <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const PhoneApp = () => {
  const [activePage, setActivePage] = useState('home');
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const betSlipCount = 2;

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={setActivePage} onOpenBetSlip={() => setBetSlipOpen(true)} betSlipCount={betSlipCount} />;
      case 'live':
        return <LivePage onNavigate={setActivePage} />;
      case 'sports':
        return <SportsPage onNavigate={setActivePage} />;
      case 'bets':
        return <BetsPage onNavigate={setActivePage} />;
      case 'account':
        return <AccountPage onNavigate={setActivePage} />;
      default:
        return <HomePage onNavigate={setActivePage} onOpenBetSlip={() => setBetSlipOpen(true)} betSlipCount={betSlipCount} />;
    }
  };

  return (
    <div
      style={customStyles.phoneFrame}
      className="flex flex-col"
    >
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {renderPage()}
        {betSlipOpen && (
          <BetSlipModal isOpen={betSlipOpen} onClose={() => setBetSlipOpen(false)} />
        )}
      </div>
      <NavBar activePage={activePage} onNavigate={(page) => { setActivePage(page); setBetSlipOpen(false); }} />
    </div>
  );
};

const App = () => {
  return (
    <Router basename="/">
      <GlobalStyles />
      <div className="min-h-screen flex items-center justify-center overflow-auto" style={{ backgroundColor: '#0f172a', padding: '2rem' }}>
        <div className="flex gap-12 items-start justify-center">
          <PhoneApp />
        </div>
      </div>
    </Router>
  );
};

export default App;