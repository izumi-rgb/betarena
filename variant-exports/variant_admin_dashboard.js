import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const customStyles = {
  root: {
    '--bg-primary': '#0B0E1A',
    '--bg-secondary': '#111827',
    '--surface': '#1A2235',
    '--surface-hover': '#232d42',
    '--border': '#1E293B',
    '--accent': '#00C37B',
    '--amber': '#F59E0B',
    '--danger': '#EF4444',
    '--text-primary': '#F1F5F9',
    '--text-secondary': '#94A3B8',
    '--text-tertiary': '#64748B',
  },
  glowGreen: {
    boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(0, 195, 123, 0.18)',
  },
  glowGreenStrong: {
    boxShadow: '0 0 0 1px #00C37B, 0 0 24px rgba(0, 195, 123, 0.25)',
  },
  glowAmber: {
    boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(245, 158, 11, 0.2)',
  },
  glowBlue: {
    boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(59, 130, 246, 0.15)',
  },
  glowPurple: {
    boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(139, 92, 246, 0.15)',
  },
};

const StatCard = ({ children, style, className }) => (
  <div className={`bg-[#1A2235] rounded-[10px] p-5 flex flex-col justify-between h-[140px] relative overflow-hidden group ${className || ''}`} style={style}>
    {children}
  </div>
);

const AgentRow = ({ color, name, credits, members, suspended }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative pl-6">
      <div className="absolute left-0 top-1/2 w-4 h-[1px] bg-[#1E293B]"></div>
      <div
        className="bg-[#1A2235] border border-[#1E293B] rounded-md p-2.5 flex items-center justify-between transition-colors group"
        style={{ backgroundColor: hovered ? '#1E293B' : '' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${suspended ? 'bg-[#EF4444]' : 'bg-[#00C37B]'}`}></div>
          {suspended ? (
            <>
              <span className="text-[#EF4444] font-bold text-[13px] line-through decoration-[#EF4444]">{name}</span>
              <span className="bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] text-[9px] px-1.5 py-0.5 rounded">SUSPENDED</span>
            </>
          ) : (
            <span className="text-white font-bold text-[13px]">{name}</span>
          )}
        </div>
        {!suspended && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-[#94A3B8] text-[11px]">{credits} CR</span>
            <span className="text-[#64748B] text-[11px]">· {members} members</span>
          </div>
        )}
        <button
          className={`bg-transparent border border-[#1E293B] text-[#64748B] text-[10px] px-2 py-0.5 rounded transition-all ${hovered ? 'opacity-100' : suspended ? 'opacity-100' : 'opacity-0'} ${suspended ? 'hover:text-[#EF4444] hover:border-[#EF4444]' : 'hover:text-[#00C37B] hover:border-[#00C37B]'}`}
        >
          Manage
        </button>
      </div>
    </div>
  );
};

const Header = ({ onlineCount }) => {
  return (
    <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 w-1/4">
        <div className="text-[#94A3B8] text-[13px] font-semibold uppercase tracking-wider">Admin Control Center</div>
      </div>

      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#00C37B]">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <h1 className="text-white font-bold text-[16px]">Admin Control Center</h1>
      </div>

      <div className="flex items-center justify-end gap-6 w-1/4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444]" style={{ animation: 'pulse-red 2s infinite' }}></div>
          <span className="text-[#EF4444] text-[12px] font-semibold">{onlineCount} users online</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-2 border-[#1E293B] shadow-lg cursor-pointer hover:border-[#00C37B] transition-colors"></div>
      </div>
    </header>
  );
};

const StatsGrid = () => (
  <div className="grid grid-cols-6 gap-4">
    <StatCard style={customStyles.glowGreen}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Total Credits Created</span>
        <div className="w-8 h-8 rounded-full bg-[rgba(0,195,123,0.1)] flex items-center justify-center text-[#00C37B]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
      </div>
      <div>
        <div className="text-white font-mono text-[24px] font-bold">100,000 <span className="text-[#64748B] text-[14px]">CR</span></div>
        <div className="text-[#64748B] text-[11px] mt-1">System Total</div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00C37B] opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </StatCard>

    <StatCard style={customStyles.glowAmber}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">In Circulation</span>
        <div className="w-8 h-8 rounded-full bg-[rgba(245,158,11,0.1)] flex items-center justify-center text-[#F59E0B]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 10h14l-4-4" />
            <path d="M17 14H3l4 4" />
          </svg>
        </div>
      </div>
      <div>
        <div className="text-[#F59E0B] font-mono text-[24px] font-bold">78,500 <span className="text-[#F59E0B] opacity-60 text-[14px]">CR</span></div>
        <div className="text-[#64748B] text-[11px] mt-1">78.5% of total</div>
      </div>
    </StatCard>

    <StatCard style={customStyles.glowBlue}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Total Agents</span>
        <div className="w-8 h-8 rounded-full bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[#3B82F6]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
      </div>
      <div>
        <div className="text-white font-mono text-[28px] font-bold">12</div>
        <div className="flex items-center gap-2 text-[11px] mt-1">
          <span className="text-[#00C37B]">10 Active</span>
          <span className="text-[#64748B]">•</span>
          <span className="text-[#EF4444]">2 Susp.</span>
        </div>
      </div>
    </StatCard>

    <StatCard style={customStyles.glowPurple}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Total Members</span>
        <div className="w-8 h-8 rounded-full bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[#8B5CF6]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>
      <div>
        <div className="text-white font-mono text-[28px] font-bold">247</div>
        <div className="text-[#64748B] text-[11px] mt-1">Online: 38</div>
      </div>
    </StatCard>

    <StatCard style={customStyles.glowGreen}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Bets Today</span>
        <div className="w-8 h-8 rounded-full bg-[rgba(0,195,123,0.1)] flex items-center justify-center text-[#00C37B]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
      </div>
      <div>
        <div className="text-white font-mono text-[24px] font-bold">1,847</div>
        <div className="text-[#00C37B] text-[11px] mt-1 font-semibold flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          +12% vs yesterday
        </div>
      </div>
    </StatCard>

    <StatCard style={customStyles.glowGreenStrong}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Platform P&L</span>
        <div className="w-8 h-8 rounded-full bg-[rgba(0,195,123,0.2)] flex items-center justify-center text-[#00C37B]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      </div>
      <div>
        <div className="text-[#00C37B] font-mono text-[26px] font-bold">+12,450 <span className="text-[#00C37B] opacity-60 text-[14px]">CR</span></div>
        <div className="text-[#00C37B] text-[11px] mt-1 font-bold">This month ▲</div>
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00C37B] to-transparent opacity-10 rounded-bl-full"></div>
    </StatCard>
  </div>
);

const OverviewChart = () => (
  <div className="w-[55%] bg-[#111827] border border-[#1E293B] rounded-xl p-6 flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-white font-bold text-[15px]">30-Day Overview</h3>
      <div className="flex items-center gap-4 text-[11px] font-medium">
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <div className="w-2 h-2 rounded-full bg-[#00C37B]"></div>
          Bet Volume
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
          P&L
        </div>
      </div>
    </div>
    <div className="flex-1 relative w-full h-full">
      <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="gradGreen" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00C37B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00C37B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradAmber" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="55" x2="600" y2="55" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1="110" x2="600" y2="110" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1="165" x2="600" y2="165" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <path d="M0,150 Q60,160 120,130 T240,140 T360,100 T480,120 T600,90 V220 H0 Z" fill="url(#gradAmber)" stroke="none" />
        <path d="M0,150 Q60,160 120,130 T240,140 T360,100 T480,120 T600,90" fill="none" stroke="#F59E0B" strokeWidth="2" />
        <path d="M0,120 Q50,90 100,100 T200,60 T300,80 T400,40 T500,70 T600,50 V220 H0 Z" fill="url(#gradGreen)" stroke="none" />
        <path d="M0,120 Q50,90 100,100 T200,60 T300,80 T400,40 T500,70 T600,50" fill="none" stroke="#00C37B" strokeWidth="2" />
      </svg>
      <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-[#475569] px-2 font-mono">
        <span>01</span><span>05</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
      </div>
    </div>
  </div>
);

const CreditHierarchy = () => {
  const [agent20Hovered, setAgent20Hovered] = useState(false);
  const [agent21Hovered, setAgent21Hovered] = useState(false);
  const [agent23Hovered, setAgent23Hovered] = useState(false);

  return (
    <div className="w-[45%] bg-[#111827] border border-[#1E293B] rounded-xl p-6 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-[15px]">Credit Hierarchy</h3>
        <div className="bg-[rgba(0,195,123,0.1)] border border-[rgba(0,195,123,0.3)] text-[#00C37B] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C37B] animate-pulse"></div> Live
        </div>
      </div>

      <div className="overflow-y-auto pr-2 flex-1">
        <div className="bg-[rgba(0,195,123,0.05)] border border-[#1E293B] border-l-[3px] border-l-[#00C37B] rounded-md p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px]">👑</span>
            <span className="text-white font-extrabold text-[13px]">ADMIN</span>
          </div>
          <span className="font-mono text-[#00C37B] text-[12px] font-bold">100,000 CR created</span>
        </div>

        <div className="pl-2 border-l border-[#1E293B] ml-2 space-y-2">
          <div className="relative pl-6">
            <div className="absolute left-0 top-1/2 w-4 h-[1px] bg-[#1E293B]"></div>
            <div
              className="border border-[#1E293B] rounded-md p-2.5 flex items-center justify-between transition-colors group cursor-pointer"
              style={{ backgroundColor: agent20Hovered ? '#1E293B' : '#1A2235' }}
              onMouseEnter={() => setAgent20Hovered(true)}
              onMouseLeave={() => setAgent20Hovered(false)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00C37B]"></div>
                <span className="text-white font-bold text-[13px]">Agent_20</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#94A3B8] text-[11px]">15,000 CR</span>
                <span className="text-[#64748B] text-[11px]">· 24 members</span>
              </div>
              <button className={`bg-transparent border border-[#1E293B] text-[#64748B] text-[10px] px-2 py-0.5 rounded hover:text-[#00C37B] hover:border-[#00C37B] transition-all ${agent20Hovered ? 'opacity-100' : 'opacity-0'}`}>
                Manage
              </button>
            </div>
            <div className="pl-4 border-l border-[#1E293B] ml-3 mt-2 space-y-2">
              <div className="relative pl-4 flex items-center justify-between text-[12px]">
                <div className="absolute left-0 top-1/2 w-3 h-[1px] bg-[#1E293B]"></div>
                <span className="text-[#94A3B8]">Sub-Agent_20a</span>
                <span className="text-[#64748B] font-mono text-[11px]">3,000 CR · 8 members</span>
              </div>
              <div className="relative pl-4 flex items-center justify-between text-[12px]">
                <div className="absolute left-0 top-1/2 w-3 h-[1px] bg-[#1E293B]"></div>
                <span className="text-[#94A3B8]">Sub-Agent_20b</span>
                <span className="text-[#64748B] font-mono text-[11px]">2,500 CR · 6 members</span>
              </div>
            </div>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-0 top-1/2 w-4 h-[1px] bg-[#1E293B]"></div>
            <div
              className="border border-[#1E293B] rounded-md p-2.5 flex items-center justify-between transition-colors cursor-pointer"
              style={{ backgroundColor: agent21Hovered ? '#1E293B' : '#1A2235' }}
              onMouseEnter={() => setAgent21Hovered(true)}
              onMouseLeave={() => setAgent21Hovered(false)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00C37B]"></div>
                <span className="text-white font-bold text-[13px]">Agent_21</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#94A3B8] text-[11px]">8,000 CR</span>
                <span className="text-[#64748B] text-[11px]">· 12 members</span>
              </div>
              <button className={`bg-transparent border border-[#1E293B] text-[#64748B] text-[10px] px-2 py-0.5 rounded hover:text-[#00C37B] hover:border-[#00C37B] transition-all ${agent21Hovered ? 'opacity-100' : 'opacity-0'}`}>
                Manage
              </button>
            </div>
          </div>

          <AgentRow name="Agent_22" suspended={true} />

          <div className="relative pl-6">
            <div className="absolute left-0 top-1/2 w-4 h-[1px] bg-[#1E293B]"></div>
            <div
              className="border border-[#1E293B] rounded-md p-2.5 flex items-center justify-between transition-colors cursor-pointer"
              style={{ backgroundColor: agent23Hovered ? '#1E293B' : '#1A2235' }}
              onMouseEnter={() => setAgent23Hovered(true)}
              onMouseLeave={() => setAgent23Hovered(false)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00C37B]"></div>
                <span className="text-white font-bold text-[13px]">Agent_23</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#94A3B8] text-[11px]">20,000 CR</span>
                <span className="text-[#64748B] text-[11px]">· 45 members</span>
              </div>
              <button className={`bg-transparent border border-[#1E293B] text-[#64748B] text-[10px] px-2 py-0.5 rounded hover:text-[#00C37B] hover:border-[#00C37B] transition-all ${agent23Hovered ? 'opacity-100' : 'opacity-0'}`}>
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const logData = [
  { id: 1, ts: '2025-03-10 14:32:01', user: 'usr_4k2m', action: 'bet.place', ip: '82.45.123.91', result: 'ok', threat: null, rowBg: '#1A2235', rowBorder: '#1E293B' },
  { id: 2, ts: '2025-03-10 14:30:48', user: 'Agent_20', action: 'credit.transfer', ip: '185.23.44.12', result: 'ok', threat: null, rowBg: '#161b2e', rowBorder: '#1E293B' },
  { id: 3, ts: '2025-03-10 14:28:15', user: 'usr_9x7p', action: 'auth.login', ip: '94.12.88.200', result: 'ok', threat: null, rowBg: '#1A2235', rowBorder: '#1E293B' },
  { id: 4, ts: '2025-03-10 14:25:02', user: 'usr_unknown', action: 'auth.login_fail', ip: '71.55.234.88', result: 'fail', threat: 'LOW', rowBg: '#161b2e', rowBorder: '#1E293B' },
  { id: 5, ts: '2025-03-10 14:22:44', user: '203.0.113.42', action: 'sqli.attempt', ip: '203.0.113.42', result: 'blocked', threat: 'CRITICAL', rowBg: '#450a0a', rowBorder: '#7f1d1d', borderLeft: true },
  { id: 6, ts: '2025-03-10 14:20:11', user: 'Admin', action: 'admin.login', ip: '10.0.0.1', result: 'ok', threat: null, rowBg: '#161b2e', rowBorder: '#1E293B' },
];

const SystemLogs = ({ threatsOnly, onToggleThreats }) => {
  const filteredLogs = threatsOnly ? logData.filter(l => l.threat) : logData;

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold text-[15px] flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          System Logs
        </h3>
        <button
          onClick={onToggleThreats}
          className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-[#F59E0B] text-[12px] font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-[rgba(245,158,11,0.2)] transition-colors"
          style={threatsOnly ? { backgroundColor: 'rgba(245,158,11,0.25)' } : {}}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Threats Only
        </button>
      </div>

      <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0B0E1A] border-b border-[#1E293B]">
              <th className="py-3 px-5 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Timestamp</th>
              <th className="py-3 px-5 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">User</th>
              <th className="py-3 px-5 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Action</th>
              <th className="py-3 px-5 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">IP Address</th>
              <th className="py-3 px-5 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Result</th>
              <th className="py-3 px-5 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Threat</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                style={{
                  backgroundColor: log.rowBg,
                  borderBottom: `1px solid ${log.rowBorder}`,
                  borderLeft: log.borderLeft ? '3px solid #EF4444' : undefined,
                }}
              >
                <td className="py-3 px-5 font-mono" style={{ color: log.result === 'blocked' ? '#FCA5A5' : '#64748B', fontWeight: log.result === 'blocked' ? 600 : undefined }}>
                  {log.ts}
                </td>
                <td className="py-3 px-5 text-white font-medium" style={{ fontStyle: log.result === 'blocked' ? 'italic' : undefined }}>
                  {log.user}
                </td>
                <td className="py-3 px-5 font-mono" style={{ color: log.result === 'blocked' ? '#EF4444' : '#94A3B8', fontWeight: log.result === 'blocked' ? 700 : undefined }}>
                  {log.action}
                </td>
                <td className="py-3 px-5 font-mono" style={{ color: log.result === 'blocked' ? '#FCA5A5' : '#64748B' }}>
                  {log.ip}
                </td>
                <td className="py-3 px-5">
                  {log.result === 'ok' && (
                    <span className="bg-[rgba(0,195,123,0.12)] text-[#00C37B] border border-[rgba(0,195,123,0.3)] text-[10px] px-2 py-0.5 rounded-full font-bold">✅ OK</span>
                  )}
                  {log.result === 'fail' && (
                    <span className="bg-[rgba(239,68,68,0.12)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] text-[10px] px-2 py-0.5 rounded-full font-bold">❌ FAIL</span>
                  )}
                  {log.result === 'blocked' && (
                    <span className="bg-[#7f1d1d] text-[#EF4444] border border-[#EF4444] text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">🚫 BLOCKED</span>
                  )}
                </td>
                <td className="py-3 px-5">
                  {log.threat === null && <span className="text-[#64748B]">—</span>}
                  {log.threat === 'LOW' && <span className="text-[#F59E0B] font-bold text-[11px]">⚠️ LOW</span>}
                  {log.threat === 'CRITICAL' && <span className="text-[#EF4444] text-[16px] animate-pulse">🚨</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const [threatsOnly, setThreatsOnly] = useState(false);

  return (
    <main className="flex-1 p-8 space-y-8">
      <StatsGrid />
      <div className="flex gap-5 h-[340px]">
        <OverviewChart />
        <CreditHierarchy />
      </div>
      <SystemLogs threatsOnly={threatsOnly} onToggleThreats={() => setThreatsOnly(p => !p)} />
    </main>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap');
      body { background-color: #0B0E1A; color: #F1F5F9; font-family: 'Inter', sans-serif; }
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
      .font-mono { font-family: 'Roboto Mono', monospace; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router basename="/">
      <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: '#0B0E1A', color: '#F1F5F9' }}>
        <Header onlineCount={247} />
        <Routes>
          <Route path="/" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;