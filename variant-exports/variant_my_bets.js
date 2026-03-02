import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useCredits } from '@/contexts/CreditsContext';
import { apiGet } from '@/lib/api';

const customStyles = {
  scrollbar: `
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0B0E1A; }
    ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #64748B; }
    @keyframes pulse-red {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .pulsing-dot { animation: pulse-red 2s infinite; }
    @keyframes pulse-opacity {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    .pulse-text { animation: pulse-opacity 1.5s infinite ease-in-out; }
    @keyframes animate-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .animate-pulse { animation: animate-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    body { background-color: #0B0E1A; font-family: 'Inter', sans-serif; }
    * { selection: background-color: #00C37B; color: black; }
    input[type=range] { -webkit-appearance: none; background: transparent; }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%;
      background: #ffffff; border: 2px solid #00C37B; cursor: pointer; margin-top: -8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%; height: 4px; cursor: pointer; background: #0B0E1A; border-radius: 2px;
    }
  `
};

const getCanonicalPath = (pathname = '') => {
  if (!pathname) return '/';
  const base = pathname.split('?')[0].split('#')[0];
  return base.length > 1 ? base.replace(/\/+$/, '') : base;
};

const Sidebar = () => {
  const { pathname: rawPathname } = useLocation();
  const pathname = getCanonicalPath(rawPathname);
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={pathname === '/in-play' ? 'text-[#00C37B]' : 'opacity-70 group-hover:opacity-100'}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className={`text-[14px] ${pathname === '/in-play' ? 'font-bold' : 'font-medium'}`}>In-Play</span>
        <span className="ml-auto bg-[#00C37B] text-[#0B0E1A] text-[10px] font-bold px-1.5 py-0.5 rounded">LIVE</span>
      </Link>

      <Link to="/my-bets" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/my-bets' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={pathname === '/my-bets' ? 'text-[#00C37B]' : 'opacity-70 group-hover:opacity-100'}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span className={`text-[14px] ${pathname === '/my-bets' ? 'font-bold' : 'font-medium'}`}>My Bets</span>
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

const AccumulatorBetCard = ({ onCashOut }) => (
  <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-5 shadow-lg">
    <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#1E293B]">
      <div className="bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
        Accumulator
      </div>
      <div className="font-mono text-[#64748B] text-[11px]"># BET-7821</div>
    </div>

    <div className="bg-[rgba(0,195,123,0.06)] border-l-[3px] border-[#00C37B] rounded-md p-3 mb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-[#00C37B] flex items-center justify-center text-[#0B0E1A]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <span className="text-white text-[13px] font-semibold">Arsenal to Win</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[#00C37B] text-[12px] font-mono font-medium">FT · 2-0 Chelsea</span>
        <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-wide">Full Time</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[#F59E0B] font-mono font-bold text-[13px]">1.95</span>
        <span className="text-[#00C37B] text-[9px] font-bold uppercase bg-[rgba(0,195,123,0.1)] px-1 rounded mt-0.5">WON</span>
      </div>
    </div>

    <div className="bg-[rgba(239,68,68,0.05)] border-l-[3px] border-[#EF4444] rounded-md p-3 mb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#EF4444] pulsing-dot ml-1"></div>
        <span className="text-white text-[13px] font-semibold ml-1">Man City vs Real Madrid</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[#EF4444] text-[11px] font-bold animate-pulse">LIVE 67' · 2-1</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[#F59E0B] font-mono font-bold text-[13px]">1.45</span>
        <span className="text-[#64748B] text-[9px] font-bold uppercase mt-0.5">PENDING</span>
      </div>
    </div>

    <div className="bg-[rgba(100,116,139,0.06)] border-l-[3px] border-[#334155] rounded-md p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" className="ml-1">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-[#94A3B8] text-[13px] font-medium ml-1">Barcelona vs Atletico</span>
      </div>
      <div className="text-[#64748B] text-[12px]">Tomorrow 20:45</div>
      <div className="flex flex-col items-end">
        <span className="text-[#F59E0B] font-mono font-bold text-[13px]">3.20</span>
        <span className="text-[#64748B] text-[10px] font-bold">—</span>
      </div>
    </div>

    <div className="pt-3 border-t border-[#1E293B]">
      <div className="flex justify-between items-center mb-4 text-[13px]">
        <div className="flex gap-4">
          <span className="text-[#94A3B8]">Stake: <span className="font-mono text-[#F1F5F9]">10.00 CR</span></span>
          <span className="text-[#94A3B8]">Combined: <span className="font-mono text-[#F59E0B]">×10.76</span></span>
        </div>
        <div className="text-[#94A3B8]">Potential: <span className="font-mono text-white font-bold text-[15px]">107.60 CR</span></div>
      </div>
      <button
        onClick={() => onCashOut('BET-7821', 34.20)}
        className="w-full bg-[#00C37B] hover:bg-[#00a86b] text-black font-extrabold text-[14px] py-3 rounded-lg uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(0,195,123,0.2)] hover:shadow-[0_6px_20px_rgba(0,195,123,0.3)] active:scale-[0.99]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        Cash Out — 34.20 CR
      </button>
    </div>
  </div>
);

const SingleBetCard = ({ onCashOut }) => {
  const [sliderValue, setSliderValue] = useState(60);

  const cashOutAmount = ((sliderValue / 100) * 22.50).toFixed(2);
  const keepAmount = (22.50 - parseFloat(cashOutAmount)).toFixed(2);

  return (
    <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-5 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-bold text-[15px]">Arsenal to Win</h3>
          <div className="bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] text-[10px] font-bold px-2 py-0.5 rounded uppercase">Open</div>
        </div>
        <div className="text-right">
          <div className="text-[#00C37B] text-[12px] font-medium">Premier League · FT · 2-0</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-5">
        <div className="font-mono text-[#F59E0B] text-[18px] font-bold">1.95</div>
        <div className="flex gap-4 text-[13px]">
          <span className="text-[#94A3B8]">Stake: <span className="font-mono text-[#F1F5F9]">25.00 CR</span></span>
          <span className="text-[#94A3B8]">Potential: <span className="font-mono text-white font-bold">48.75 CR</span></span>
        </div>
      </div>

      <button
        onClick={() => onCashOut('Arsenal-Win', 22.50)}
        className="w-full bg-[#00C37B] hover:bg-[#00a86b] text-black font-extrabold text-[14px] py-3 rounded-lg uppercase tracking-wide mb-4 transition-all shadow-[0_4px_12px_rgba(0,195,123,0.2)]"
      >
        Cash Out — 22.50 CR
      </button>

      <div className="bg-[rgba(0,195,123,0.04)] border border-[rgba(0,195,123,0.15)] rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wide">Partial Cash Out</span>
          <div className="text-[#64748B] cursor-pointer hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <div className="mb-4 relative h-6 flex items-center">
          <div className="absolute w-full h-1 bg-[#0B0E1A] rounded-full"></div>
          <div className="absolute h-1 bg-[#00C37B] rounded-full" style={{ width: `${sliderValue}%` }}></div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={e => setSliderValue(Number(e.target.value))}
            className="w-full absolute z-10 opacity-0 cursor-pointer"
          />
          <div
            className="absolute w-5 h-5 bg-white border-2 border-[#00C37B] rounded-full shadow cursor-pointer pointer-events-none"
            style={{ left: `calc(${sliderValue}% - 10px)` }}
          ></div>
          <div
            className="absolute -top-6 -translate-x-1/2 text-[10px] font-mono font-bold text-[#00C37B]"
            style={{ left: `${sliderValue}%` }}
          >{sliderValue}%</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[#64748B] text-[10px] uppercase font-semibold">Cash Out</span>
              <span className="text-[#00C37B] font-mono text-[13px] font-bold">{cashOutAmount} CR</span>
            </div>
            <div className="w-px h-6 bg-[#1E293B]"></div>
            <div className="flex flex-col">
              <span className="text-[#64748B] text-[10px] uppercase font-semibold">Keep</span>
              <span className="text-[#94A3B8] font-mono text-[13px]">{keepAmount} CR</span>
            </div>
          </div>
          <button
            onClick={() => onCashOut('Arsenal-Partial', parseFloat(cashOutAmount))}
            className="bg-transparent border border-[#00C37B] text-[#00C37B] hover:bg-[rgba(0,195,123,0.1)] text-[11px] font-bold px-3 py-1.5 rounded transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

const LiveBetCard = () => (
  <div className="bg-[#1A2235] border border-[rgba(239,68,68,0.4)] rounded-xl p-5 shadow-[0_0_20px_rgba(239,68,68,0.08)]">
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] pulsing-dot"></div>
        <span className="text-[#EF4444] font-extrabold text-[12px] tracking-wide uppercase">LIVE</span>
        <span className="text-[#EF4444] font-mono text-[12px]">78'</span>
      </div>
      <div className="text-[#94A3B8] text-[12px]">Man City vs PSG</div>
    </div>

    <div className="text-center mb-6">
      <div className="text-white text-[15px] font-bold mb-4">Over 2.5 Goals</div>
      <div className="flex items-center justify-center gap-6">
        <span className="text-[#94A3B8] text-[13px] font-medium">Man City</span>
        <div className="font-mono text-white text-[24px] font-bold tracking-widest flex gap-3">
          <span>2</span><span className="text-[#334155]">—</span><span>1</span>
        </div>
        <span className="text-[#94A3B8] text-[13px] font-medium">PSG</span>
      </div>
    </div>

    <div className="pt-4 border-t border-[rgba(239,68,68,0.2)]">
      <div className="flex justify-between items-center mb-3 text-[13px]">
        <span className="text-[#94A3B8]">Stake: <span className="font-mono text-[#F1F5F9]">15.00 CR</span></span>
        <span className="text-[#94A3B8]">Odds: <span className="font-mono text-[#F59E0B]">1.50</span></span>
        <span className="text-[#94A3B8]">Potential: <span className="font-mono text-white font-bold">22.50 CR</span></span>
      </div>
      <div className="flex items-center justify-center gap-2 text-[#475569] text-[11px] bg-[#0B0E1A] py-2 rounded-md">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        <span>Cash Out not available in-play</span>
      </div>
    </div>
  </div>
);

const SettledBets = () => (
  <>
    <div className="flex items-center gap-4 pt-4 pb-2">
      <div className="h-px bg-[#1E293B] flex-1"></div>
      <span className="text-[#64748B] text-[11px] font-bold uppercase tracking-widest">Settled Bets</span>
      <div className="h-px bg-[#1E293B] flex-1"></div>
    </div>

    <div className="bg-[#1A2235] border-l-[3px] border-l-[#00C37B] rounded-r-xl rounded-l-md p-5 flex items-center justify-between shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-[rgba(0,195,123,0.12)] text-[#00C37B] border border-[rgba(0,195,123,0.3)] text-[10px] font-bold px-2 py-0.5 rounded uppercase">✅ WON</span>
          <span className="text-white font-bold text-[13px]">Arsenal to Win</span>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[#94A3B8]">Premier League</span>
          <span className="text-[#334155]">•</span>
          <span className="text-[#F59E0B] font-mono">Odds 1.95</span>
        </div>
      </div>
      <div className="text-right flex flex-col gap-1">
        <span className="text-[#64748B] text-[11px]">Stake: 25.00 CR</span>
        <span className="text-[#00C37B] font-mono text-[16px] font-bold">Return: 48.75 CR</span>
      </div>
    </div>

    <div className="bg-[#1A2235] border-l-[3px] border-l-[#EF4444] rounded-r-xl rounded-l-md p-5 flex items-center justify-between shadow-sm mb-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-[rgba(239,68,68,0.12)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] text-[10px] font-bold px-2 py-0.5 rounded uppercase">❌ LOST</span>
          <span className="text-white font-bold text-[13px]">Draw — Man Utd vs Liverpool</span>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[#94A3B8]">Premier League</span>
          <span className="text-[#334155]">•</span>
          <span className="text-[#F59E0B] font-mono">Odds 3.20</span>
        </div>
      </div>
      <div className="text-right flex flex-col gap-1">
        <span className="text-[#64748B] text-[11px]">Stake: <span className="line-through">20.00 CR</span></span>
        <span className="text-[#EF4444] font-mono text-[16px] font-bold">Return: 0.00 CR</span>
      </div>
    </div>
  </>
);

const CashOutModal = ({ isOpen, onClose, betId, amount }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 w-[340px] shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[rgba(0,195,123,0.15)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-[16px]">Confirm Cash Out</h3>
            <p className="text-[#64748B] text-[12px]">Bet #{betId}</p>
          </div>
        </div>
        <div className="bg-[#0B0E1A] rounded-lg p-4 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-[#94A3B8] text-[13px]">Cash Out Amount</span>
            <span className="text-[#00C37B] font-mono font-bold text-[20px]">{typeof amount === 'number' ? amount.toFixed(2) : amount} CR</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#334155] font-semibold text-[13px] py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#00C37B] hover:bg-[#00a86b] text-black font-extrabold text-[13px] py-2.5 rounded-lg transition-all shadow-[0_4px_12px_rgba(0,195,123,0.2)]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const ApiBetCard = ({ bet }) => {
  const statusColor = bet.status === 'open' ? '#00C37B' : bet.status === 'won' ? '#00C37B' : bet.status === 'lost' ? '#EF4444' : '#F59E0B';
  return (
    <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-[14px] capitalize">{bet.type} Bet</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${statusColor}20`, color: statusColor }}>{(bet.status || 'open').toUpperCase()}</span>
        </div>
        <span className="text-[#64748B] text-[11px] font-mono">{bet.uid || bet.id}</span>
      </div>
      {(bet.selections || []).map((sel, i) => (
        <div key={i} className="bg-[#111827] border border-[#1E293B] rounded-lg p-3">
          <div className="flex justify-between">
            <span className="text-[#94A3B8] text-[12px]">{sel.market_type}</span>
            <span className="text-[#F59E0B] font-mono font-bold text-[13px]">{parseFloat(sel.odds).toFixed(2)}</span>
          </div>
          <div className="text-white font-bold text-[13px] mt-1">{sel.selection_name}</div>
        </div>
      ))}
      <div className="flex justify-between border-t border-[#1E293B] pt-3">
        <div>
          <div className="text-[#64748B] text-[11px]">Stake</div>
          <div className="text-white font-mono font-bold">{parseFloat(bet.stake).toFixed(2)} CR</div>
        </div>
        <div className="text-right">
          <div className="text-[#64748B] text-[11px]">Potential Return</div>
          <div className="text-[#00C37B] font-mono font-bold">{parseFloat(bet.potential_return || 0).toFixed(2)} CR</div>
        </div>
      </div>
    </div>
  );
};

const MyBetsPage = () => {
  const [activeTab, setActiveTab] = useState('open');
  const [cashOutModal, setCashOutModal] = useState({ isOpen: false, betId: '', amount: 0 });
  const [apiBets, setApiBets] = useState([]);
  const [betsLoading, setBetsLoading] = useState(true);
  const { isAuthenticated } = useCredits();

  useEffect(() => {
    if (!isAuthenticated) { setBetsLoading(false); return; }
    const fetchBets = async () => {
      try {
        const res = await apiGet('/api/bets/my-bets');
        if (res.success && res.data) {
          const bets = Array.isArray(res.data) ? res.data : (res.data.bets || []);
          setApiBets(bets);
        }
      } catch { /* fallback to hardcoded */ }
      finally { setBetsLoading(false); }
    };
    fetchBets();
  }, [isAuthenticated]);

  const handleCashOut = (betId, amount) => {
    setCashOutModal({ isOpen: true, betId, amount });
  };

  const closeModal = () => setCashOutModal({ isOpen: false, betId: '', amount: 0 });

  const openBets = apiBets.filter(b => b.status === 'open' || b.status === 'pending');
  const settledBets = apiBets.filter(b => ['won', 'lost', 'void', 'settled'].includes(b.status));
  const hasApiBets = apiBets.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 pt-6">
      <div className="max-w-[800px] mx-auto w-full">
        <div className="flex items-center gap-6 border-b border-[#1E293B] mb-8">
          <button
            onClick={() => setActiveTab('open')}
            className={`pb-3 border-b-2 font-semibold text-[14px] flex items-center gap-2 transition-colors ${activeTab === 'open' ? 'border-[#00C37B] text-white' : 'border-transparent text-[#94A3B8] hover:text-white'}`}
          >
            Open Bets
            <span className="bg-[rgba(0,195,123,0.15)] text-[#00C37B] text-[11px] px-1.5 py-0.5 rounded font-bold">{hasApiBets ? openBets.length : 3}</span>
          </button>
          <button
            onClick={() => setActiveTab('settled')}
            className={`pb-3 border-b-2 font-medium text-[14px] transition-colors ${activeTab === 'settled' ? 'border-[#00C37B] text-white font-semibold' : 'border-transparent text-[#94A3B8] hover:text-white'}`}
          >
            Settled Bets
          </button>
          <button
            onClick={() => setActiveTab('cashout')}
            className={`pb-3 border-b-2 font-medium text-[14px] transition-colors flex items-center gap-2 ${activeTab === 'cashout' ? 'border-[#00C37B] text-white font-semibold' : 'border-transparent text-[#94A3B8] hover:text-white'}`}
          >
            Cash Out
            <span className="bg-[rgba(245,158,11,0.15)] text-[#F59E0B] text-[11px] px-1.5 py-0.5 rounded font-bold">{hasApiBets ? openBets.filter(b => b.cashout_available).length : 2}</span>
          </button>
        </div>

        {betsLoading && (
          <div className="text-center py-12 text-[#64748B]">
            <div className="animate-spin w-8 h-8 border-2 border-[#00C37B] border-t-transparent rounded-full mx-auto mb-3" />
            <div className="text-[13px]">Loading your bets...</div>
          </div>
        )}

        <div className="space-y-4">
          {activeTab === 'open' && !betsLoading && (
            hasApiBets ? (
              openBets.length > 0 ? openBets.map(bet => <ApiBetCard key={bet.id || bet.uid} bet={bet} />) : (
                <div className="text-center py-12 text-[#64748B]"><div className="text-[32px] mb-2">📋</div><div className="text-[14px]">No open bets</div></div>
              )
            ) : (
              <>
                <AccumulatorBetCard onCashOut={handleCashOut} />
                <SingleBetCard onCashOut={handleCashOut} />
                <LiveBetCard />
                <SettledBets />
              </>
            )
          )}

          {activeTab === 'settled' && !betsLoading && (
            hasApiBets ? (
              settledBets.length > 0 ? settledBets.map(bet => <ApiBetCard key={bet.id || bet.uid} bet={bet} />) : (
                <div className="text-center py-12 text-[#64748B]"><div className="text-[32px] mb-2">📋</div><div className="text-[14px]">No settled bets yet</div></div>
              )
            ) : (
              <SettledBets />
            )
          )}

          {activeTab === 'cashout' && (
            <>
              <AccumulatorBetCard onCashOut={handleCashOut} />
              <SingleBetCard onCashOut={handleCashOut} />
            </>
          )}
        </div>
      </div>

      <CashOutModal
        isOpen={cashOutModal.isOpen}
        onClose={closeModal}
        betId={cashOutModal.betId}
        amount={cashOutModal.amount}
      />
    </div>
  );
};

const App = () => {
  const { balance, isLoading: balanceLoading, formatBalance } = useCredits();
  const navTabsWithHref = [
    { label: 'Home', href: '/sports' },
    { label: 'In-Play', href: '/in-play' },
    { label: 'Results', href: '/results' },
    { label: 'My Bets', href: '/my-bets' },
    { label: 'Account', href: '/account' },
  ];
  const { pathname: rawPathname } = useLocation();
  const pathname = getCanonicalPath(rawPathname);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = customStyles.scrollbar;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'radial-gradient(circle at top center, #1a2235 0%, #0B0E1A 60%)', color: '#F1F5F9', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 shrink-0 px-6 flex items-center justify-between border-b border-[#1E293B] backdrop-blur z-10" style={{ backgroundColor: 'rgba(11,14,26,0.95)' }}>
          <nav className="flex gap-1">
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

        <MyBetsPage />
      </main>
    </div>
  );
};

export default App;
