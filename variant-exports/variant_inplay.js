import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

const customStyles = {
  pulsingDot: {
    animation: 'pulse-red 2s infinite',
  },
  pulsingDotGreen: {
    animation: 'pulse-green 2s infinite',
  },
  scoreFlash: {
    animation: 'flash-green 1s ease-out',
  },
};

const OddButton = ({ label, value, onClick }) => {
  const [selected, setSelected] = useState(false);

  const handleClick = () => {
    setSelected(!selected);
    if (onClick) onClick(label, value);
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-[#0B0E1A] border rounded-lg py-2 flex flex-col items-center transition-all group/btn ${
        selected
          ? 'border-[#00C37B] bg-[rgba(0,195,123,0.1)]'
          : 'border-[#1E293B] hover:border-[#00C37B] hover:bg-[rgba(0,195,123,0.05)]'
      }`}
    >
      <span className="text-[#64748B] text-[10px] font-bold uppercase mb-0.5 group-hover/btn:text-[#94A3B8]">
        {label}
      </span>
      <span className={`font-mono font-bold text-[15px] ${selected ? 'text-[#00C37B]' : 'text-[#F59E0B]'}`}>
        {value}
      </span>
    </button>
  );
};

const PulsingDot = ({ color = 'red', size = 'w-1.5 h-1.5' }) => {
  const bgColor = color === 'green' ? 'bg-[#00C37B]' : 'bg-[#EF4444]';
  return (
    <div
      className={`${size} rounded-full ${bgColor}`}
      style={customStyles.pulsingDot}
    />
  );
};

const ScoreUpdateItem = ({ icon, matchTitle, scoreDisplay, time, highlighted = false }) => (
  <div
    className={`${highlighted ? 'bg-[#1A2235]' : 'hover:bg-[#1A2235]'} border-b border-[#1E293B] rounded px-3 py-2.5 flex items-center justify-between group cursor-pointer transition-colors`}
  >
    <div className="flex flex-col gap-0.5 w-[75%]">
      <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] mb-0.5">
        <span>{icon}</span>
        <span className="truncate">{matchTitle}</span>
      </div>
      <div className="text-white font-mono font-bold text-[13px] truncate">{scoreDisplay}</div>
    </div>
    <div className="flex flex-col items-end">
      <PulsingDot color="red" size="w-1.5 h-1.5" />
      <span className="text-[#EF4444] font-mono font-bold text-[11px] mt-1">{time}</span>
    </div>
  </div>
);

const FootballCard = ({ addToBetslip }) => {
  return (
    <div className="bg-[#1A2235] border border-[#1E293B] border-l-[3px] border-l-[#00C37B] rounded-xl p-5 relative overflow-hidden" style={{ transition: 'all 0.2s ease' }}>
      <div className="flex justify-between items-center mb-4 text-[12px]">
        <div className="flex items-center gap-2">
          <PulsingDot color="red" size="w-1.5 h-1.5" />
          <span className="text-[#EF4444] font-extrabold uppercase tracking-wide">LIVE</span>
          <span className="text-[#EF4444] font-mono font-bold">67'</span>
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <span>Premier League</span>
          <span className="text-[14px]">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
        </div>
        <div className="flex items-center gap-2 text-[#64748B] hover:text-[#00C37B] cursor-pointer transition-colors">
          <span className="font-medium">+142 markets</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 px-4">
        <span className="text-white font-bold text-[18px] w-1/3 text-right">Arsenal</span>
        <div className="flex items-center gap-3">
          <div className="bg-[#0B0E1A] border border-[#1E293B] rounded px-3 py-1 font-mono text-[22px] font-bold text-white shadow-inner">2</div>
          <span className="text-[#334155] font-bold text-[14px]">vs</span>
          <div className="bg-[#0B0E1A] border border-[#1E293B] rounded px-3 py-1 font-mono text-[22px] font-bold text-white shadow-inner">1</div>
        </div>
        <span className="text-white font-bold text-[18px] w-1/3 text-left">Chelsea</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <OddButton label="Arsenal" value="1.45" onClick={addToBetslip} />
        <OddButton label="Draw" value="4.20" onClick={addToBetslip} />
        <OddButton label="Chelsea" value="7.50" onClick={addToBetslip} />
      </div>

      <div className="bg-[#111827] rounded-lg px-3 py-2 flex items-center justify-between text-[11px] text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <span>⚽ Corners</span>
          <span className="text-[#94A3B8] font-mono font-bold">7-3</span>
        </div>
        <div className="w-px h-3 bg-[#1E293B]" />
        <div className="flex items-center gap-1.5">
          <span>🟨 Cards</span>
          <span className="text-[#94A3B8] font-mono font-bold">1-0</span>
        </div>
        <div className="w-px h-3 bg-[#1E293B]" />
        <div className="flex items-center gap-1.5">
          <span>🎯 Shots</span>
          <span className="text-[#94A3B8] font-mono font-bold">12-6</span>
        </div>
      </div>
    </div>
  );
};

const TennisCard = ({ addToBetslip }) => {
  return (
    <div className="bg-[#1A2235] border border-[#1E293B] border-l-[3px] border-l-[#F59E0B] rounded-xl p-5">
      <div className="flex justify-between items-center mb-4 text-[12px]">
        <div className="flex items-center gap-2">
          <PulsingDot color="red" size="w-1.5 h-1.5" />
          <span className="text-[#EF4444] font-extrabold uppercase tracking-wide">LIVE</span>
          <span className="text-[#EF4444] font-mono font-bold">3rd Set</span>
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <span>ATP Wimbledon</span>
          <span className="text-[14px]">🎾</span>
        </div>
        <div className="flex items-center gap-2 text-[#64748B] hover:text-[#00C37B] cursor-pointer transition-colors">
          <span className="font-medium">+38 markets</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 px-2">
        <div className="flex items-center gap-2 w-1/3 justify-end">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C37B]" />
          <span className="text-white font-bold text-[18px]">Djokovic</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#F1F5F9] text-[14px]">
            6-4, 3-6, <span className="text-[#00C37B] font-bold text-[18px]">2</span>
          </span>
          <span className="text-[#334155] font-bold text-[14px]">vs</span>
          <span className="font-mono text-[#F1F5F9] text-[14px]">
            6-4, 3-6, <span className="text-[#EF4444] font-bold text-[18px]">1</span>
          </span>
        </div>
        <span className="text-white font-bold text-[18px] w-1/3 text-left">Alcaraz</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <OddButton label="Djokovic" value="1.65" onClick={addToBetslip} />
        <OddButton label="Alcaraz" value="2.20" onClick={addToBetslip} />
      </div>
      <div className="text-center">
        <span className="text-[#64748B] text-[10px] font-medium">1st Serve %: 78% vs 65%</span>
      </div>
    </div>
  );
};

const BasketballCard = ({ addToBetslip }) => {
  return (
    <div className="bg-[#1A2235] border border-[#1E293B] border-l-[3px] border-l-[#3B82F6] rounded-xl p-5">
      <div className="flex justify-between items-center mb-4 text-[12px]">
        <div className="flex items-center gap-2">
          <PulsingDot color="red" size="w-1.5 h-1.5" />
          <span className="text-[#EF4444] font-extrabold uppercase tracking-wide">LIVE</span>
          <span className="text-[#EF4444] font-mono font-bold">Q3 8:42</span>
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <span>NBA</span>
          <span className="text-[14px]">🏀</span>
        </div>
        <div className="flex items-center gap-2 text-[#64748B] hover:text-[#00C37B] cursor-pointer transition-colors">
          <span className="font-medium">+89 markets</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 px-4">
        <span className="text-white font-bold text-[18px] w-1/3 text-right">Lakers</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#F1F5F9] text-[26px] font-bold">78</span>
          <span className="text-[#334155] font-bold text-[14px]">—</span>
          <span className="font-mono text-[#F1F5F9] text-[26px] font-bold">71</span>
        </div>
        <span className="text-white font-bold text-[18px] w-1/3 text-left">Warriors</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <OddButton label="Lakers -3.5" value="1.90" onClick={addToBetslip} />
        <OddButton label="Over 224.5" value="1.85" onClick={addToBetslip} />
      </div>

      <div className="flex justify-center gap-1">
        <div className="h-1 w-8 bg-[#334155] rounded-full" />
        <div className="h-1 w-8 bg-[#334155] rounded-full" />
        <div className="h-1 w-8 bg-[#00C37B] rounded-full" />
        <div className="h-1 w-8 bg-[#111827] rounded-full" />
      </div>
    </div>
  );
};

const CricketCard = ({ addToBetslip }) => {
  return (
    <div className="bg-[#1A2235] border border-[#1E293B] border-l-[3px] border-l-[#8B5CF6] rounded-xl p-5">
      <div className="flex justify-between items-center mb-4 text-[12px]">
        <div className="flex items-center gap-2">
          <PulsingDot color="red" size="w-1.5 h-1.5" />
          <span className="text-[#EF4444] font-extrabold uppercase tracking-wide">LIVE</span>
          <span className="text-[#EF4444] font-mono font-bold">Over 32.4</span>
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <span>IPL T20</span>
          <span className="text-[14px]">🏏</span>
        </div>
        <div className="flex items-center gap-2 text-[#64748B] hover:text-[#00C37B] cursor-pointer transition-colors">
          <span className="font-medium">+52 markets</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 px-2">
        <div className="flex items-center gap-2 w-1/3 justify-end">
          <span className="bg-[#00C37B] text-[#0B0E1A] text-[9px] font-bold px-1 rounded">BAT</span>
          <span className="text-white font-bold text-[16px] truncate">Mumbai Indians</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#00C37B] text-[20px] font-bold">187/4</span>
          <span className="text-[#334155] font-bold text-[14px]">vs</span>
          <span className="font-mono text-[#64748B] text-[20px] font-bold">Target</span>
        </div>
        <span className="text-white font-bold text-[16px] w-1/3 text-left truncate">RCB</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <OddButton label="Mumbai" value="1.35" onClick={addToBetslip} />
        <OddButton label="RCB" value="3.10" onClick={addToBetslip} />
      </div>

      <div className="bg-[#111827] rounded-lg px-3 py-2 flex items-center justify-between text-[11px] text-[#64748B]">
        <span>Run Rate: <strong className="text-[#94A3B8]">8.4</strong></span>
        <div className="w-px h-3 bg-[#1E293B]" />
        <span>Required: <strong className="text-[#94A3B8]">156</strong> from <strong className="text-[#94A3B8]">104</strong> balls</span>
        <div className="w-px h-3 bg-[#1E293B]" />
        <span>Need: <strong className="text-[#94A3B8]">7.8/ov</strong></span>
      </div>
    </div>
  );
};

const Sidebar = () => {
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

        <Link to="/in-play" className={`flex items-center gap-3 px-3 py-2.5 rounded-md border-l-[3px] transition-colors relative ${pathname === '/in-play' ? 'bg-[#1A2235] text-white border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white border-transparent'}`} style={{ textDecoration: 'none' }}>
          <div className="absolute inset-0 bg-[#00C37B] opacity-5 rounded-md pointer-events-none" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#00C37B]">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-bold text-[14px]">In-Play</span>
          <span className="ml-auto bg-[#00C37B] text-[#0B0E1A] text-[10px] font-bold px-1.5 py-0.5 rounded">LIVE</span>
        </Link>

        <Link to="/live" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/live' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <span className="font-medium text-[14px]">Live Stream</span>
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

      <Link to="/account" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/account' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={pathname === '/account' ? 'text-[#00C37B]' : 'opacity-70 group-hover:opacity-100'}>
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
        <span className={`text-[14px] ${pathname === '/account' ? 'font-bold' : 'font-medium'}`}>Account</span>
      </Link>
      </nav>

      <div className="p-4 border-t border-[#1E293B]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1A2235] cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-[#1E293B]" />
          <div className="flex flex-col">
            <span className="text-white text-[13px] font-bold">AlexP</span>
            <span className="text-[#00C37B] text-[11px] font-mono">2,450.50 CR</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" className="ml-auto">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="mt-2 flex gap-2">
          <button className="flex-1 bg-[#1A2235] hover:bg-[#232d42] text-[#94A3B8] text-[11px] font-bold py-1.5 rounded border border-[#1E293B] transition-colors">
            Settings
          </button>
          <button className="flex-1 bg-[#1A2235] hover:bg-[#232d42] text-[#94A3B8] text-[11px] font-bold py-1.5 rounded border border-[#1E293B] transition-colors">
            Deposit
          </button>
        </div>
      </div>
    </aside>
  );
};

const ScoreUpdatesPanel = ({ addToBetslip }) => {
  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 sticky top-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-[15px]">Score Updates</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[#64748B] text-[11px]">Updated 2s ago</span>
          <div
            className="w-1.5 h-1.5 rounded-full bg-[#00C37B]"
            style={customStyles.pulsingDot}
          />
        </div>
      </div>

      <div className="space-y-1 mb-5">
        <ScoreUpdateItem
          icon="⚽"
          matchTitle="Arsenal 2–1 Chelsea"
          scoreDisplay={
            <span>
              Arsenal <span className="text-[#00C37B]">2</span> – 1 Chelsea
            </span>
          }
          time="78'"
          highlighted={true}
        />
        <ScoreUpdateItem
          icon="⚽"
          matchTitle="Man City 1–0 Liverpool"
          scoreDisplay="Man City 1 – 0 Liverpool"
          time="45'"
        />
        <ScoreUpdateItem
          icon="⚽"
          matchTitle="Real Madrid 3–1 Atletico"
          scoreDisplay={
            <span>
              Real Madrid <span className="text-[#00C37B]">3</span> – 1 Atletico
            </span>
          }
          time="67'"
        />
        <ScoreUpdateItem
          icon="🎾"
          matchTitle="Djokovic 2–1 Alcaraz"
          scoreDisplay="Djokovic 2 – 1 Alcaraz"
          time="3rd"
        />
        <ScoreUpdateItem
          icon="🏀"
          matchTitle="Lakers 78–71 Warriors"
          scoreDisplay={
            <span>
              Lakers <span className="text-[#00C37B]">78</span> – 71 Warriors
            </span>
          }
          time="Q3"
        />
        <ScoreUpdateItem
          icon="⚽"
          matchTitle="PSG 0–2 Bayern"
          scoreDisplay="PSG 0 – 2 Bayern"
          time="82'"
        />
        <ScoreUpdateItem
          icon="🎾"
          matchTitle="Sinner 6-4 Medvedev"
          scoreDisplay="Sinner 6-4 Medvedev"
          time="2nd"
        />
        <ScoreUpdateItem
          icon="🏒"
          matchTitle="Leafs 3–2 Bruins"
          scoreDisplay={
            <span>
              Leafs <span className="text-[#00C37B]">3</span> – 2 Bruins
            </span>
          }
          time="OT"
        />
      </div>

      <div className="border-t border-[#1E293B] pt-4">
        <h4 className="text-white font-bold text-[13px] mb-3">Featured Market</h4>
        <div className="bg-[#1A2235] border border-[#1E293B] rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#94A3B8] text-[12px] font-medium">Arsenal Next Goal</span>
            <span className="text-[#00C37B] text-[10px] font-bold">Trending 🔥</span>
          </div>
          <button
            onClick={() => addToBetslip('Over 2.5 Goals', '2.20')}
            className="w-full bg-[#0B0E1A] border border-[#1E293B] hover:border-[#F59E0B] rounded py-2 flex items-center justify-between px-3 group"
          >
            <span className="text-[#64748B] text-[12px] font-bold uppercase group-hover:text-white transition-colors">
              Over 2.5 Goals
            </span>
            <span className="text-[#F59E0B] font-mono font-bold text-[16px]">2.20</span>
          </button>
          <div className="text-center mt-2">
            <button className="text-[#00C37B] text-[11px] font-bold hover:underline">Quick Bet</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const sportFilters = [
  { label: 'All Sports 247', active: true },
  { label: '⚽ Football 89', active: false },
  { label: '🎾 Tennis 42', active: false },
  { label: '🏀 Basketball 31', active: false },
  { label: '🏏 Cricket 18', active: false },
  { label: '🏒 Hockey 24', active: false },
  { label: '🥊 Boxing 4', active: false },
  { label: '🎮 Esports 12', active: false },
  { label: '+ More', active: false },
];

const InPlayPage = () => {
  const [activeSport, setActiveSport] = useState(0);
  const [betslip, setBetslip] = useState([]);
  const [showBetslipToast, setShowBetslipToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const addToBetslip = (label, value) => {
    setBetslip(prev => [...prev, { label, value, id: Date.now() }]);
    setToastMessage(`Added: ${label} @ ${value}`);
    setShowBetslipToast(true);
    setTimeout(() => setShowBetslipToast(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 pt-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[22px] font-extrabold text-white tracking-tight">⚡ In-Play</h1>
            <div
              className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"
              style={customStyles.pulsingDot}
            />
          </div>
          <div className="text-[#00C37B] text-[13px] font-medium">247 events live right now</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Auto-refresh</span>
          <div className="bg-[rgba(0,195,123,0.1)] border border-[#00C37B] text-[#00C37B] px-2 py-0.5 rounded text-[10px] font-bold">ON</div>
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto mb-8 pb-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {sportFilters.map((sport, index) => (
          <button
            key={index}
            onClick={() => setActiveSport(index)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
              activeSport === index
                ? 'bg-[#00C37B] text-[#0B0E1A] font-bold border-[#00C37B]'
                : 'bg-[#1A2235] text-[#94A3B8] hover:text-white hover:border-[#00C37B] border-[#1E293B]'
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="w-[65%] flex flex-col gap-4">
          <FootballCard addToBetslip={addToBetslip} />
          <TennisCard addToBetslip={addToBetslip} />
          <BasketballCard addToBetslip={addToBetslip} />
          <CricketCard addToBetslip={addToBetslip} />

          <button className="w-full mt-2 py-3 border border-[#00C37B] text-[#00C37B] font-semibold text-[13px] rounded-lg hover:bg-[rgba(0,195,123,0.05)] transition-colors">
            Load More Live Events (243 remaining)
          </button>
        </div>

        <div className="w-[35%] flex flex-col">
          <ScoreUpdatesPanel addToBetslip={addToBetslip} />
        </div>
      </div>

      {showBetslipToast && (
        <div className="fixed bottom-6 right-6 bg-[#00C37B] text-[#0B0E1A] px-4 py-3 rounded-lg font-bold text-[13px] shadow-lg z-50 transition-all">
          ✓ {toastMessage}
        </div>
      )}
    </div>
  );
};

const App = () => {

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --bg-primary: #0B0E1A;
        --bg-secondary: #111827;
        --surface: #1A2235;
        --surface-hover: #232d42;
        --border: #1E293B;
        --accent: #00C37B;
        --amber: #F59E0B;
        --danger: #EF4444;
        --blue: #3B82F6;
        --purple: #8B5CF6;
        --text-primary: #F1F5F9;
        --text-secondary: #94A3B8;
        --text-tertiary: #64748B;
      }

      body {
        background-color: #0B0E1A;
        color: #F1F5F9;
        font-family: 'Inter', sans-serif;
      }

      @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }

      @keyframes flash-green {
        0% { color: #F1F5F9; }
        50% { color: #00C37B; }
        100% { color: #F1F5F9; }
      }

      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #0B0E1A; }
      ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #64748B; }

      ::selection { background: #00C37B; color: black; }
    `;
    document.head.appendChild(style);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const navTabsWithHref = [
    { label: 'Sports', href: '/sports' },
    { label: 'In-Play', href: '/in-play' },
    { label: 'Live Stream', href: '/live' },
    { label: 'My Bets', href: '/my-bets' },
    { label: 'Results', href: '/results' },
    { label: 'Account', href: '/account' },
  ];
  const { pathname } = useLocation();

  return (
    <Router basename="/">
      <div
        className="h-screen flex overflow-hidden"
        style={{ background: 'radial-gradient(circle at top center, #1a2235 0%, #0B0E1A 60%)', color: '#F1F5F9', fontFamily: "'Inter', sans-serif" }}
      >
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <header className="h-16 shrink-0 px-6 flex items-center justify-between border-b border-[#1E293B] backdrop-blur z-10" style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)' }}>
            <nav className="flex gap-1">
              {navTabsWithHref.map(({ label, href }) => {
                const active = pathname === href || (href === '/sports' ? pathname.startsWith('/sports') : pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    to={href}
                    className={`px-4 py-2 text-[14px] rounded transition-colors ${
                      active
                        ? 'font-medium text-[#F1F5F9] bg-[#1A2235]'
                        : 'font-medium text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                    }`}
                    style={{ textDecoration: 'none' }}
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

          <Routes>
            <Route path="/" element={<InPlayPage />} />
          </Routes>

        </main>
      </div>
    </Router>
  );
};

export default App;
