'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCredits } from '@/contexts/CreditsContext';
import { useAuthStore } from '@/stores/authStore';
import { apiGet } from '@/lib/api';
import { MemberSidebarProfile } from '@/components/app/MemberSidebarProfile';

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

const OddButton = ({ label, value, onClick, selected = false }) => {
  const unavailable = value === '--';
  return (
    <button
      onClick={() => !unavailable && onClick && onClick(label, value)}
      disabled={unavailable}
      className={`bg-[#0B0E1A] border rounded-lg py-2 flex flex-col items-center transition-all group/btn ${
        unavailable
          ? 'border-[#1E293B] opacity-50 cursor-not-allowed'
          : selected
            ? 'border-[#00C37B] bg-[rgba(0,195,123,0.1)]'
            : 'border-[#1E293B] hover:border-[#00C37B] hover:bg-[rgba(0,195,123,0.05)]'
      }`}
    >
      <span className={`text-[10px] font-bold uppercase mb-0.5 ${selected ? 'text-[#00C37B]' : 'text-[#64748B] group-hover/btn:text-[#94A3B8]'}`}>
        {label}
      </span>
      <span className={`font-mono font-bold text-[15px] ${unavailable ? 'text-[#475569]' : selected ? 'text-[#00C37B]' : 'text-[#F59E0B]'}`}>
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

const FootballCard = ({ onOddClick, selections }) => {
  const matchId = 'football-ars-che';
  const isSelected = (label) => selections.some(s => s.selKey === `${matchId}-${label}`);
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
        <OddButton label="Arsenal" value="1.45" selected={isSelected('Arsenal')} onClick={() => onOddClick(matchId, 'Arsenal vs Chelsea', 'Match Result', 'Arsenal', '1.45')} />
        <OddButton label="Draw" value="4.20" selected={isSelected('Draw')} onClick={() => onOddClick(matchId, 'Arsenal vs Chelsea', 'Match Result', 'Draw', '4.20')} />
        <OddButton label="Chelsea" value="7.50" selected={isSelected('Chelsea')} onClick={() => onOddClick(matchId, 'Arsenal vs Chelsea', 'Match Result', 'Chelsea', '7.50')} />
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

const TennisCard = ({ onOddClick, selections }) => {
  const matchId = 'tennis-djok-alc';
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
        <OddButton label="Djokovic" value="1.65" selected={selections.some(s => s.selKey === `${matchId}-Djokovic`)} onClick={() => onOddClick(matchId, 'Djokovic vs Alcaraz', 'Match Winner', 'Djokovic', '1.65')} />
        <OddButton label="Alcaraz" value="2.20" selected={selections.some(s => s.selKey === `${matchId}-Alcaraz`)} onClick={() => onOddClick(matchId, 'Djokovic vs Alcaraz', 'Match Winner', 'Alcaraz', '2.20')} />
      </div>
      <div className="text-center">
        <span className="text-[#64748B] text-[10px] font-medium">1st Serve %: 78% vs 65%</span>
      </div>
    </div>
  );
};

const BasketballCard = ({ onOddClick, selections }) => {
  const matchId = 'nba-lak-war';
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
        <OddButton label="Lakers -3.5" value="1.90" selected={selections.some(s => s.selKey === `${matchId}-Lakers -3.5`)} onClick={() => onOddClick(matchId, 'Lakers vs Warriors', 'Handicap', 'Lakers -3.5', '1.90')} />
        <OddButton label="Over 224.5" value="1.85" selected={selections.some(s => s.selKey === `${matchId}-Over 224.5`)} onClick={() => onOddClick(matchId, 'Lakers vs Warriors', 'Total', 'Over 224.5', '1.85')} />
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

const CricketCard = ({ onOddClick, selections }) => {
  const matchId = 'cricket-mi-rcb';
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
        <OddButton label="Mumbai" value="1.35" selected={selections.some(s => s.selKey === `${matchId}-Mumbai`)} onClick={() => onOddClick(matchId, 'Mumbai Indians vs RCB', 'Match Winner', 'Mumbai', '1.35')} />
        <OddButton label="RCB" value="3.10" selected={selections.some(s => s.selKey === `${matchId}-RCB`)} onClick={() => onOddClick(matchId, 'Mumbai Indians vs RCB', 'Match Winner', 'RCB', '3.10')} />
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

const LiveMatchCard = ({ event, onOddClick, selections }) => {
  const matchId = `live-${event.id}`;
  const config = SPORT_CONFIG[event.sport] || { color: '#00C37B', emoji: '🏅', label: event.sport };
  const homeName = event.homeTeam?.name || 'Home';
  const awayName = event.awayTeam?.name || 'Away';
  const matchLabel = `${homeName} vs ${awayName}`;
  const isSelected = (label) => selections.some(s => s.selKey === `${matchId}-${label}`);
  const odds = getEventOdds(event);
  const hasDraw = ['football'].includes(event.sport);
  const marketsLen = (event.markets || []).length;

  return (
    <div className="bg-[#1A2235] border border-[#1E293B] border-l-[3px] rounded-xl p-5 relative overflow-hidden" style={{ borderLeftColor: config.color, transition: 'all 0.2s ease' }}>
      <div className="flex justify-between items-center mb-4 text-[12px]">
        <div className="flex items-center gap-2">
          <PulsingDot color={event.status === 'pre' ? 'green' : 'red'} size="w-1.5 h-1.5" />
          <span className={`font-extrabold uppercase tracking-wide ${event.status === 'pre' ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
            {event.status === 'pre' ? 'UPCOMING' : event.status === 'ht' ? 'HT' : event.status === 'ft' ? 'FT' : 'LIVE'}
          </span>
          {event.status !== 'pre' && event.clock && <span className="text-[#EF4444] font-mono font-bold">{event.clock}</span>}
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <span>{event.competition?.name || config.label}</span>
          <span className="text-[14px]">{config.emoji}</span>
        </div>
        {marketsLen > 0 && <div className="flex items-center gap-2 text-[#64748B] hover:text-[#00C37B] cursor-pointer transition-colors">
          <span className="font-medium">+{marketsLen} markets</span>
        </div>}
      </div>

      <div className="flex items-center justify-between mb-5 px-4">
        <span className="text-white font-bold text-[18px] w-1/3 text-right truncate">{homeName}</span>
        {event.status === 'pre' ? (
          <div className="flex items-center gap-2">
            <span className="text-[#F59E0B] font-mono font-bold text-[16px]">
              {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="bg-[#0B0E1A] border border-[#1E293B] rounded px-3 py-1 font-mono text-[22px] font-bold text-white shadow-inner">{event.score?.home ?? 0}</div>
            <span className="text-[#334155] font-bold text-[14px]">vs</span>
            <div className="bg-[#0B0E1A] border border-[#1E293B] rounded px-3 py-1 font-mono text-[22px] font-bold text-white shadow-inner">{event.score?.away ?? 0}</div>
          </div>
        )}
        <span className="text-white font-bold text-[18px] w-1/3 text-left truncate">{awayName}</span>
      </div>

      <div className={`grid ${hasDraw ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-4`}>
        <OddButton
          label={homeName}
          value={odds.home}
          selected={isSelected(homeName)}
          onClick={() => onOddClick(matchId, matchLabel, 'Match Result', homeName, odds.home)}
        />
        {hasDraw && (
          <OddButton
            label="Draw"
            value={odds.draw}
            selected={isSelected('Draw')}
            onClick={() => onOddClick(matchId, matchLabel, 'Match Result', 'Draw', odds.draw)}
          />
        )}
        <OddButton
          label={awayName}
          value={odds.away}
          selected={isSelected(awayName)}
          onClick={() => onOddClick(matchId, matchLabel, 'Match Result', awayName, odds.away)}
        />
      </div>
    </div>
  );
};

function getInitials(name) {
  if (!name) return '??';
  const parts = name.split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const { formatBalance } = useCredits();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    router.push('/login');
  };

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
        <Link href="/sports" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/sports' || pathname.startsWith('/sports/') ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="font-medium text-[14px]">Sports</span>
        </Link>

        <Link href="/in-play" className={`flex items-center gap-3 px-3 py-2.5 rounded-md border-l-[3px] transition-colors relative ${pathname === '/in-play' ? 'bg-[#1A2235] text-white border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white border-transparent'}`} style={{ textDecoration: 'none' }}>
          <div className="absolute inset-0 bg-[#00C37B] opacity-5 rounded-md pointer-events-none" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#00C37B]">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-bold text-[14px]">In-Play</span>
          <span className="ml-auto bg-[#00C37B] text-[#0B0E1A] text-[10px] font-bold px-1.5 py-0.5 rounded">LIVE</span>
        </Link>

        <Link href="/my-bets" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/my-bets' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className="font-medium text-[14px]">My Bets</span>
        </Link>

      <Link href="/results" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/results' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        <span className="font-medium text-[14px]">Results</span>
      </Link>

      <Link href="/account" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${pathname === '/account' ? 'bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'}`} style={{ textDecoration: 'none' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={pathname === '/account' ? 'text-[#00C37B]' : 'opacity-70 group-hover:opacity-100'}>
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
        <span className={`text-[14px] ${pathname === '/account' ? 'font-bold' : 'font-medium'}`}>Account</span>
      </Link>
      </nav>

      {isAuthenticated && user ? (
        <div className="relative border-t border-[#1E293B] p-4">
          <MemberSidebarProfile
            initials={getInitials(user.username)}
            username={user.username}
            balanceLabel={formatBalance()}
            onClick={() => setShowMenu((v) => !v)}
          />
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute bottom-full left-4 right-4 mb-2 z-50 bg-[#1A2235] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden">
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
      ) : (
        <div className="border-t border-[#1E293B] p-4">
          <MemberSidebarProfile initials="GU" username="Guest" balanceLabel="Sign in" />
        </div>
      )}
    </aside>
  );
};

const ScoreUpdatesPanel = ({ onOddClick, selections, liveEvents = [] }) => {
  const sportEmoji = (sport) => {
    const map = { football: '⚽', soccer: '⚽', tennis: '🎾', basketball: '🏀', cricket: '🏏', hockey: '🏒', baseball: '⚾', boxing: '🥊', esports: '🎮' };
    return map[(sport || '').toLowerCase()] || '🏅';
  };

  const liveItems = liveEvents.length > 0
    ? liveEvents.slice(0, 8).map(ev => ({
        icon: sportEmoji(ev.sport),
        matchTitle: `${ev.homeTeam?.name || 'Home'} ${ev.score?.home ?? 0}–${ev.score?.away ?? 0} ${ev.awayTeam?.name || 'Away'}`,
        scoreDisplay: (
          <span>
            {ev.homeTeam?.name || 'Home'}{' '}
            <span className="text-[#00C37B]">{ev.score?.home ?? 0}</span>
            {' – '}
            {ev.score?.away ?? 0} {ev.awayTeam?.name || 'Away'}
          </span>
        ),
        time: ev.clock || ev.status || 'LIVE',
        highlighted: false,
      }))
    : null;

  const items = liveItems || [];
  if (items.length > 0) items[0].highlighted = true;

  const featuredEvent = liveEvents.length > 0 ? liveEvents[0] : null;
  const featuredMarket = featuredEvent?.markets?.[0];
  const featuredSelection = featuredMarket?.selections?.[0] || featuredMarket?.outcomes?.[0];
  const featuredMatchId = featuredEvent ? `live-${featuredEvent.id}` : null;
  const featuredLabel = featuredEvent ? `${featuredEvent.homeTeam?.name || 'Home'} vs ${featuredEvent.awayTeam?.name || 'Away'}` : null;
  const featuredSelectionName = featuredSelection?.name || 'Unavailable';
  const featuredSelectionOdds = typeof featuredSelection?.odds === 'number'
    ? featuredSelection.odds.toFixed(2)
    : (featuredSelection?.odds || featuredSelection?.price ? String(featuredSelection.odds || featuredSelection.price) : '--');
  const featuredIsSelected = featuredMatchId
    ? selections.some(s => s.selKey === `${featuredMatchId}-${featuredSelectionName}`)
    : false;

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 sticky top-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-[15px]">Score Updates</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[#64748B] text-[11px]">{liveEvents.length > 0 ? 'Live' : 'Updated 2s ago'}</span>
          <div
            className="w-1.5 h-1.5 rounded-full bg-[#00C37B]"
            style={customStyles.pulsingDot}
          />
        </div>
      </div>

      <div className="space-y-1 mb-5">
        {items.map((item, idx) => (
          <ScoreUpdateItem
            key={idx}
            icon={item.icon}
            matchTitle={item.matchTitle}
            scoreDisplay={item.scoreDisplay}
            time={item.time}
            highlighted={item.highlighted}
          />
        ))}
      </div>

      <div className="border-t border-[#1E293B] pt-4">
        <h4 className="text-white font-bold text-[13px] mb-3">Featured Market</h4>
        <div className="bg-[#1A2235] border border-[#1E293B] rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#94A3B8] text-[12px] font-medium">
              {featuredMarket?.name || 'No featured market available'}
            </span>
            <span className="text-[#00C37B] text-[10px] font-bold">{featuredEvent ? 'Live' : 'Waiting'}</span>
          </div>
          <button
            onClick={() => {
              if (!featuredMatchId || !featuredLabel || featuredSelectionOdds === '--') return;
              onOddClick(
                featuredMatchId,
                featuredLabel,
                featuredMarket?.name || 'Market',
                featuredSelectionName,
                featuredSelectionOdds
              );
            }}
            disabled={!featuredEvent || featuredSelectionOdds === '--'}
            className={`w-full bg-[#0B0E1A] border rounded py-2 flex items-center justify-between px-3 group ${
              featuredIsSelected ? 'border-[#00C37B] bg-[rgba(0,195,123,0.1)]' : 'border-[#1E293B] hover:border-[#F59E0B]'
            }`}
          >
            <span className={`text-[12px] font-bold uppercase transition-colors ${
              featuredIsSelected ? 'text-[#00C37B]' : 'text-[#64748B] group-hover:text-white'
            }`}>
              {featuredSelectionName}
            </span>
            <span className={`font-mono font-bold text-[16px] ${
              featuredIsSelected ? 'text-[#00C37B]' : 'text-[#F59E0B]'
            }`}>{featuredSelectionOdds}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const sportFilters = [
  { label: 'All Sports', active: true },
  { label: '⚽ Football', active: false },
  { label: '🎾 Tennis', active: false },
  { label: '🏀 Basketball', active: false },
  { label: '🏏 Cricket', active: false },
  { label: '🏒 Hockey', active: false },
  { label: '🥊 Boxing', active: false },
  { label: '🎮 Esports', active: false },
  { label: '+ More', active: false },
];

const SPORT_MAP = ['all', 'football', 'tennis', 'basketball', 'cricket', 'hockey', 'ice_hockey', 'baseball', 'boxing', 'esports'];
const CARD_SPORT = { FootballCard: 'football', TennisCard: 'tennis', BasketballCard: 'basketball', CricketCard: 'cricket' };

const SPORT_CONFIG = {
  football: { color: '#00C37B', emoji: '⚽', label: 'Football' },
  basketball: { color: '#3B82F6', emoji: '🏀', label: 'Basketball' },
  tennis: { color: '#F59E0B', emoji: '🎾', label: 'Tennis' },
  cricket: { color: '#8B5CF6', emoji: '🏏', label: 'Cricket' },
  hockey: { color: '#06B6D4', emoji: '🏒', label: 'Hockey' },
  ice_hockey: { color: '#06B6D4', emoji: '🏒', label: 'Ice Hockey' },
  baseball: { color: '#EF4444', emoji: '⚾', label: 'Baseball' },
  rugby: { color: '#059669', emoji: '🏉', label: 'Rugby' },
  handball: { color: '#D946EF', emoji: '🤾', label: 'Handball' },
  volleyball: { color: '#F97316', emoji: '🏐', label: 'Volleyball' },
  boxing: { color: '#F97316', emoji: '🥊', label: 'Boxing' },
  esports: { color: '#A855F7', emoji: '🎮', label: 'Esports' },
};

const getEventOdds = (event) => {
  const mkts = event.markets || [];
  const market = mkts.find(m =>
    ['h2h', 'match_result', '1x2', 'moneyline'].includes((m.id || m.type || '').toLowerCase())
  ) || mkts[0];
  const sels = market?.selections || market?.outcomes || [];
  if (sels.length >= 2) {
    const findSel = (label) => sels.find(s =>
      s.name === label || (s.name || '').toLowerCase() === label.toLowerCase()
    );
    const homeSel = findSel('Home') || sels[0];
    const awaySel = findSel('Away') || sels[sels.length > 2 ? 2 : 1];
    const drawSel = findSel('Draw') || (sels.length > 2 ? sels[1] : null);
    return {
      home: parseFloat(homeSel?.odds || homeSel?.price || 0) ? parseFloat(homeSel?.odds || homeSel?.price).toFixed(2) : '--',
      away: parseFloat(awaySel?.odds || awaySel?.price || 0) ? parseFloat(awaySel?.odds || awaySel?.price).toFixed(2) : '--',
      draw: drawSel ? (parseFloat(drawSel.odds || drawSel.price || 0) ? parseFloat(drawSel.odds || drawSel.price).toFixed(2) : '--') : '--',
    };
  }
  return { home: '--', away: '--', draw: '--' };
};

const BetslipPanel = ({ selections, removeFromSlip, stake, setStake, onPlaceBet, isPlacing, betPlaced, betError, balance, formatBalance, isAuthenticated }) => {
  const stakeNum = parseFloat(stake) || 0;
  const totalOdds = selections.reduce((acc, s) => acc * parseFloat(s.odds), 1);
  const estReturn = selections.length > 0 ? (stakeNum * (selections.length === 1 ? parseFloat(selections[0].odds) : totalOdds)).toFixed(2) : '0.00';

  if (betPlaced) return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#00C37B] flex items-center justify-center text-[28px] mx-auto mb-3">✓</div>
      <div className="text-white font-bold text-[16px] mb-1">Bet Placed!</div>
      <div className="text-[#94A3B8] text-[13px]">Good luck!</div>
    </div>
  );

  if (selections.length === 0) return null;

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1E293B] flex justify-between items-center">
        <span className="text-white font-bold text-[14px]">Betslip ({selections.length})</span>
        <button onClick={() => selections.forEach(s => removeFromSlip(s.selKey))} className="text-[#EF4444] text-[11px] font-bold hover:underline">Clear</button>
      </div>
      <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
        {selections.map(sel => (
          <div key={sel.selKey} className="bg-[#1A2235] border border-[#1E293B] rounded-lg p-3 relative">
            <button onClick={() => removeFromSlip(sel.selKey)} className="absolute top-2 right-2 text-[#64748B] hover:text-[#EF4444] text-[11px]">✕</button>
            <div className="text-[#94A3B8] text-[11px] mb-1">{sel.matchLabel}</div>
            <div className="text-[#00C37B] font-bold text-[13px] mb-1">{sel.outcomeLabel}</div>
            <div className="flex justify-between text-[12px]">
              <span className="text-[#94A3B8]">{sel.market}</span>
              <span className="text-[#F59E0B] font-mono font-bold">{sel.odds}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[#1E293B] space-y-3">
        {isAuthenticated && (
          <div className="flex justify-between text-[11px]">
            <span className="text-[#64748B]">Available</span>
            <span className={`font-mono font-bold ${stakeNum > balance ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>{formatBalance()}</span>
          </div>
        )}
        <input type="text" value={stake} onChange={e => setStake(e.target.value)} placeholder="Stake..." className="w-full bg-[#0B0E1A] border border-[#1E293B] rounded-lg px-3 py-2 text-white font-mono text-[14px] outline-none focus:border-[#00C37B]" />
        <div className="flex gap-1">
          {['+10', '+25', '+50'].map(a => (
            <button key={a} onClick={() => setStake(((parseFloat(stake) || 0) + parseFloat(a)).toFixed(2))} className="flex-1 bg-[#1A2235] border border-[#1E293B] rounded text-[#94A3B8] text-[11px] font-bold py-1 hover:border-[#00C37B] hover:text-white">{a}</button>
          ))}
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-[#94A3B8]">Est. Returns</span>
          <span className="text-[#00C37B] font-mono font-bold">{estReturn} CR</span>
        </div>
        {betError && <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg px-3 py-2 text-[#EF4444] text-[11px] text-center">{betError}</div>}
        <button
          onClick={onPlaceBet}
          disabled={isPlacing}
          className={`w-full py-2.5 rounded-lg font-bold text-[13px] transition-colors ${
            isPlacing ? 'bg-[#1E293B] text-[#94A3B8] cursor-not-allowed' :
            !isAuthenticated ? 'bg-[#3B82F6] text-white' :
            stakeNum > balance ? 'bg-[#EF4444] text-white cursor-not-allowed' :
            'bg-[#00C37B] text-[#0B0E1A] hover:bg-[#00a86b]'
          }`}
        >
          {isPlacing ? 'PLACING...' : !isAuthenticated ? 'LOGIN TO BET' : stakeNum > balance ? 'INSUFFICIENT BALANCE' : `PLACE BET (${selections.length})`}
        </button>
      </div>
    </div>
  );
};

const InPlayPage = () => {
  const [activeSport, setActiveSport] = useState(0);
  const [selections, setSelections] = useState([]);
  const [stake, setStake] = useState('50.00');
  const [isPlacing, setIsPlacing] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);
  const [betError, setBetError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const router = useRouter();
  const { balance, formatBalance, placeBet: apiPlaceBet, isAuthenticated } = useCredits();

  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchLive = async () => {
      try {
        const res = await apiGet('/api/sports/live');
        if (mounted && res.success) {
          const live = Array.isArray(res.data) ? res.data : (res.data?.live || []);
          const upcoming = Array.isArray(res.data) ? [] : (res.data?.upcoming || []);
          setLiveEvents(live);
          setUpcomingEvents(upcoming);
          setLiveError(false);
        }
      } catch {
        if (mounted) setLiveError(true);
      } finally {
        if (mounted) setLiveLoading(false);
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const onOddClick = useCallback((matchId, matchLabel, market, outcomeLabel, odds) => {
    const selKey = `${matchId}-${outcomeLabel}`;
    setSelections(prev => {
      const exists = prev.find(s => s.selKey === selKey);
      if (exists) {
        setToastMsg(`Removed: ${outcomeLabel}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1500);
        return prev.filter(s => s.selKey !== selKey);
      }
      setToastMsg(`Added: ${outcomeLabel} @ ${odds}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
      return [...prev, { selKey, matchLabel, market, outcomeLabel, odds }];
    });
    setBetError(null);
  }, []);

  const removeFromSlip = useCallback((selKey) => {
    setSelections(prev => prev.filter(s => s.selKey !== selKey));
  }, []);

  const handlePlaceBet = useCallback(async () => {
    if (selections.length === 0 || isPlacing) return;
    setBetError(null);
    if (!isAuthenticated) { router.push('/login'); return; }
    const stakeVal = parseFloat(stake) || 0;
    if (stakeVal <= 0) { setBetError('Enter a valid stake'); return; }
    if (stakeVal > balance) { setBetError('Insufficient balance'); return; }
    setIsPlacing(true);
    try {
      const apiSels = selections.map(s => ({ event_id: s.selKey.split('-')[1] || 1, market_type: s.market, selection_name: s.outcomeLabel, odds: parseFloat(s.odds) }));
      const result = await apiPlaceBet({ type: selections.length === 1 ? 'single' : 'accumulator', stake: stakeVal, selections: apiSels });
      if (result.success) {
        setBetPlaced(true);
        setToastMsg(`Bet placed! Stake: ${stakeVal.toFixed(2)} CR`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setTimeout(() => { setBetPlaced(false); setSelections([]); setStake('50.00'); }, 2500);
      } else {
        setBetError(result.message || 'Bet placement failed');
      }
    } catch (e) { setBetError(e?.response?.data?.message || e?.message || 'Something went wrong'); }
    finally { setIsPlacing(false); }
  }, [selections, stake, balance, isAuthenticated, isPlacing, apiPlaceBet, router]);

  const allEvents = useMemo(() => [...liveEvents, ...upcomingEvents], [liveEvents, upcomingEvents]);
  const useLiveData = allEvents.length > 0;

  const sportCounts = useMemo(() => {
    if (!useLiveData) return {};
    const counts = {};
    allEvents.forEach(e => { counts[e.sport] = (counts[e.sport] || 0) + 1; });
    return counts;
  }, [allEvents, useLiveData]);

  const dynamicSportFilters = useMemo(() => {
    if (!useLiveData) return sportFilters;
    const total = liveEvents.length;
    const filters = [{ label: `All Sports ${total}`, active: true }];
    const order = ['football', 'tennis', 'basketball', 'ice_hockey', 'baseball', 'cricket', 'rugby', 'handball', 'volleyball', 'hockey', 'boxing', 'esports'];
    order.forEach(sport => {
      if (sportCounts[sport]) {
        const cfg = SPORT_CONFIG[sport] || {};
        filters.push({ label: `${cfg.emoji || '🏅'} ${cfg.label || sport} ${sportCounts[sport]}`, active: false });
      }
    });
    Object.keys(sportCounts).forEach(sport => {
      if (!order.includes(sport)) {
        const cfg = SPORT_CONFIG[sport] || {};
        filters.push({ label: `${cfg.emoji || '🏅'} ${sport.charAt(0).toUpperCase() + sport.slice(1)} ${sportCounts[sport]}`, active: false });
      }
    });
    return filters;
  }, [allEvents, sportCounts, useLiveData]);

  const dynamicSportMap = useMemo(() => {
    if (!useLiveData) return SPORT_MAP;
    const map = ['all'];
    const order = ['football', 'tennis', 'basketball', 'ice_hockey', 'baseball', 'cricket', 'rugby', 'handball', 'volleyball', 'hockey', 'boxing', 'esports'];
    order.forEach(sport => { if (sportCounts[sport]) map.push(sport); });
    Object.keys(sportCounts).forEach(sport => { if (!order.includes(sport)) map.push(sport); });
    return map;
  }, [sportCounts, useLiveData]);

  const currentFilters = useLiveData ? dynamicSportFilters : sportFilters;
  const safeActiveSport = Math.min(activeSport, currentFilters.length - 1);
  const activeSportKey = (useLiveData ? dynamicSportMap : SPORT_MAP)[safeActiveSport] || 'all';

  const filteredLiveEvents = useMemo(() => {
    if (!useLiveData) return [];
    if (activeSportKey === 'all') return liveEvents;
    return liveEvents.filter(e => e.sport === activeSportKey);
  }, [liveEvents, activeSportKey, useLiveData]);

  const filteredUpcomingEvents = useMemo(() => {
    if (activeSportKey === 'all') return upcomingEvents;
    return upcomingEvents.filter(e => e.sport === activeSportKey);
  }, [upcomingEvents, activeSportKey]);

  if (liveLoading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0B0E1A]">
      <div className="text-center text-[#64748B]">
        <div className="animate-spin w-8 h-8 border-2 border-[#00C37B] border-t-transparent rounded-full mx-auto mb-3" />
        <div className="text-[13px]">Loading live events...</div>
      </div>
    </div>
  );

  if (liveError) return (
    <div className="flex-1 flex items-center justify-center bg-[#0B0E1A]">
      <div className="text-center text-[#64748B]">
        <div className="text-[32px] mb-2">⚠️</div>
        <div className="text-[14px]">Unable to load live events.</div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-8 pt-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[22px] font-extrabold text-white tracking-tight">⚡ In-Play</h1>
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" style={customStyles.pulsingDot} />
          </div>
          <div className="text-[#00C37B] text-[13px] font-medium">{liveEvents.length > 0 ? `${liveEvents.length} events live right now` : upcomingEvents.length > 0 ? `${upcomingEvents.length} upcoming events` : 'No live events right now'}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Auto-refresh</span>
          <div className="bg-[rgba(0,195,123,0.1)] border border-[#00C37B] text-[#00C37B] px-2 py-0.5 rounded text-[10px] font-bold">ON</div>
        </div>
      </div>

      {useLiveData && <div className="flex gap-2.5 overflow-x-auto mb-8 pb-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {currentFilters.map((sport, index) => (
          <button
            key={index}
            onClick={() => setActiveSport(index)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
              safeActiveSport === index
                ? 'bg-[#00C37B] text-[#0B0E1A] font-bold border-[#00C37B]'
                : 'bg-[#1A2235] text-[#94A3B8] hover:text-white hover:border-[#00C37B] border-[#1E293B]'
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>}

      <div className="flex gap-6">
        <div className={`${selections.length > 0 ? 'w-[50%]' : 'w-[65%]'} flex flex-col gap-4 transition-all`}>
          {filteredLiveEvents.length > 0 ? (
            <>
              {filteredLiveEvents.map(event => (
                <LiveMatchCard key={event.id} event={event} onOddClick={onOddClick} selections={selections} />
              ))}
              <div className="w-full mt-2 py-3 text-center text-[#64748B] text-[13px]">
                {`Showing ${filteredLiveEvents.length} of ${liveEvents.length} live events`}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-[#64748B]">
              <div className="text-[32px] mb-2">📺</div>
              <div className="text-[14px]">No live matches right now — check back soon</div>
            </div>
          )}

          {filteredUpcomingEvents.length > 0 && (
            <>
              <div className="flex items-center gap-3 mt-6 mb-3">
                <h2 className="text-[16px] font-bold text-white">Upcoming</h2>
                <span className="text-[12px] text-[#F59E0B] font-medium">{filteredUpcomingEvents.length} events</span>
              </div>
              {filteredUpcomingEvents.map(event => (
                <LiveMatchCard key={`upcoming-${event.id}`} event={event} onOddClick={onOddClick} selections={selections} />
              ))}
            </>
          )}
        </div>

        <div className={`${selections.length > 0 ? 'w-[50%]' : 'w-[35%]'} flex flex-col gap-4 transition-all`}>
          {selections.length > 0 && (
            <BetslipPanel
              selections={selections}
              removeFromSlip={removeFromSlip}
              stake={stake}
              setStake={setStake}
              onPlaceBet={handlePlaceBet}
              isPlacing={isPlacing}
              betPlaced={betPlaced}
              betError={betError}
              balance={balance}
              formatBalance={formatBalance}
              isAuthenticated={isAuthenticated}
            />
          )}
          <ScoreUpdatesPanel onOddClick={onOddClick} selections={selections} liveEvents={liveEvents} />
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-[#00C37B] text-[#0B0E1A] px-4 py-3 rounded-lg font-bold text-[13px] shadow-lg z-50 transition-all">
          ✓ {toastMsg}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const { balance, isLoading: balanceLoading, formatBalance } = useCredits();

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
    { label: 'Home', href: '/sports' },
    { label: 'In-Play', href: '/in-play' },
    { label: 'Results', href: '/results' },
    { label: 'My Bets', href: '/my-bets' },
    { label: 'Account', href: '/account' },
  ];
  const pathname = usePathname();

  return (
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
                  href={href}
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

        <InPlayPage />

      </main>
    </div>
  );
};

export default App;
