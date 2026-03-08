import React, { useState, useEffect } from 'react';
import { useCredits } from '@/contexts/CreditsContext';
import { useAuthStore } from '@/stores/authStore';

const customStyles = {
  silkPattern: {
    background: 'repeating-linear-gradient(45deg, #F59E0B, #F59E0B 10px, #92400E 10px, #92400E 20px)'
  },
  glowAmber: {
    boxShadow: '0 0 24px rgba(245, 158, 11, 0.15)'
  },
  glowText: {
    textShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
  },
  activePulseBorder: {
    animation: 'pulse-border 2s infinite'
  }
};

const horses = [
  { id: 1, no: 1, name: 'Hurricane Fly', jockey: 'R. Walsh', trainer: 'W. Mullins', form: [1, 1, 2, 1], winOdds: '2.50', ewOdds: '2.50', isFav: true, silkStyle: { background: 'linear-gradient(135deg, #EF4444, #991B1B)' }, silkClass: '' },
  { id: 2, no: 2, name: 'Golden Cross', jockey: 'A. Coleman', trainer: 'N. Henderson', form: [2, 1, 1, 3], winOdds: '3.50', ewOdds: '3.50', isFav: false, silkStyle: { background: 'linear-gradient(135deg, #F59E0B, #D97706)' }, silkClass: '' },
  { id: 3, no: 3, name: 'Tiger Roll', jockey: 'D. Russell', trainer: 'G. Elliott', form: [1, 1, 1, 2], winOdds: '4.00', ewOdds: '4.00', isFav: false, silkStyle: { background: 'linear-gradient(135deg, #3B82F6, #1E40AF)' }, silkClass: '' },
  { id: 4, no: 4, name: 'Noble Prince', jockey: 'P. Townend', trainer: 'W. Mullins', form: [3, 2, 1, 1], winOdds: '6.00', ewOdds: '6.00', isFav: false, silkStyle: { background: 'linear-gradient(135deg, #22C55E, #15803D)' }, silkClass: '' },
  { id: 5, no: 5, name: 'Faugheen', jockey: 'J. Berry', trainer: 'N. Meade', form: [1, 2, 3, 1], winOdds: '8.00', ewOdds: '8.00', isFav: false, silkStyle: { background: 'linear-gradient(135deg, #374151, #111827)' }, silkClass: '' },
  { id: 6, no: 6, name: 'Presenting Percy', jockey: 'P. Kelly', trainer: 'P. Kelly', form: [2, 1, 3, 2], winOdds: '10.00', ewOdds: '10.00', isFav: false, silkStyle: { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }, silkClass: '' },
  { id: 7, no: 7, name: 'Minella Indo', jockey: 'R. Blackmore', trainer: 'H. de Bromhead', form: [1, 3, 2, 1], winOdds: '12.00', ewOdds: '12.00', isFav: false, silkStyle: { background: 'linear-gradient(135deg, #EC4899, #BE185D)' }, silkClass: '' },
  { id: 8, no: 8, name: 'Envoi Allen', jockey: 'C. Bowe', trainer: 'G. Elliott', form: [2, 2, 1, 3], winOdds: '14.00', ewOdds: '14.00', isFav: false, silkStyle: null, silkClass: 'silk-pattern' },
];

const getFormColor = (pos) => {
  if (pos === 1) return 'text-[#00C37B] font-bold';
  if (pos === 2) return 'text-[#F59E0B]';
  return 'text-[#94A3B8]';
};

const FormDisplay = ({ form }) => (
  <span className="font-mono text-[12px]">
    {form.map((pos, i) => (
      <span key={i}>
        <span className={getFormColor(pos)}>{pos}</span>
        {i < form.length - 1 && <span className="text-[#94A3B8]">-</span>}
      </span>
    ))}
  </span>
);

const HorseRow = ({ horse, index, onAddToBetSlip }) => {
  const isEven = index % 2 === 0;
  const bg = isEven ? 'bg-[#1A2235]' : 'bg-[rgba(17,24,39,0.5)]';

  return (
    <div className={`${bg} border-b border-[#1E293B] px-5 py-3 grid gap-4 items-center hover:bg-[#232d42] transition-colors group`}
      style={{ gridTemplateColumns: '50px 60px 1fr 130px 130px 90px 100px 100px 50px' }}>
      <div className="flex items-center gap-1">
        <span className="font-mono text-white font-bold text-[14px]">{horse.no}</span>
        {horse.isFav && (
          <span className="bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.4)] text-[#F59E0B] text-[9px] px-1 py-0.5 rounded font-extrabold uppercase leading-none">FAV</span>
        )}
      </div>
      <div>
        {horse.silkClass === 'silk-pattern' ? (
          <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm" style={customStyles.silkPattern}></div>
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm" style={horse.silkStyle}></div>
        )}
      </div>
      <div className="text-white font-bold text-[14px] uppercase tracking-wide">{horse.name}</div>
      <div className="text-[#94A3B8] text-[13px]">{horse.jockey}</div>
      <div className="text-[#94A3B8] text-[13px]">{horse.trainer}</div>
      <div><FormDisplay form={horse.form} /></div>
      <div>
        <button
          onClick={() => onAddToBetSlip(horse, 'win')}
          className="w-full bg-[#0B0E1A] border border-[#1E293B] group-hover:border-[#00C37B] hover:bg-[rgba(0,195,123,0.05)] rounded-md py-2 text-[#F59E0B] font-mono font-bold text-[14px] transition-all"
        >{horse.winOdds}</button>
      </div>
      <div>
        <button
          onClick={() => onAddToBetSlip(horse, 'ew')}
          className="w-full bg-[#0B0E1A] border border-[#1E293B] hover:border-[#00C37B] hover:bg-[rgba(0,195,123,0.05)] rounded-md py-2 text-[#F59E0B] font-mono font-bold text-[13px] opacity-70 hover:opacity-100 transition-all"
        >{horse.ewOdds}</button>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => onAddToBetSlip(horse, 'win')}
          className="w-7 h-7 rounded bg-[#1E293B] hover:bg-[#00C37B] hover:text-black text-[#64748B] flex items-center justify-center transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

const races = [
  { label: 'R1 13:00', done: true },
  { label: 'R2 13:35', done: true },
  { label: 'R3 14:10', done: true },
  { label: 'R4 15:15', active: true },
  { label: 'R5 15:50' },
  { label: 'R6 16:25' },
  { label: 'R7 17:00' },
];

const betTypeOptions = ['Win', 'Each Way', 'Place Only', 'Forecast', 'Reverse Forecast', 'Each Way Double'];

const App = () => {
  const [countdown, setCountdown] = useState(60 * 12 + 34);
  const [activeBetType, setActiveBetType] = useState('Win');
  const [betSlipTab, setBetSlipTab] = useState('Singles');
  const [betSlipItems, setBetSlipItems] = useState([
    { horse: horses[0], type: 'WIN', stake: '10.00' }
  ]);
  const [showNonRunners, setShowNonRunners] = useState(false);
  const [showRule4, setShowRule4] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { balance } = useCredits();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    window.location.href = '/login';
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-border {
        0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
        70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
        100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
      }
      .active-race-indicator { animation: pulse-border 2s infinite; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #0B0E1A; }
      ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #64748B; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) return 60 * 12 + 34;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

  const addToBetSlip = (horse, type) => {
    const typeLabel = type === 'ew' ? 'EW' : 'WIN';
    const exists = betSlipItems.find(i => i.horse.id === horse.id && i.type === typeLabel);
    if (!exists) {
      setBetSlipItems(prev => [...prev, { horse, type: typeLabel, stake: '10.00' }]);
    }
  };

  const removeFromBetSlip = (idx) => {
    setBetSlipItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateStake = (idx, val) => {
    setBetSlipItems(prev => prev.map((item, i) => i === idx ? { ...item, stake: val } : item));
  };

  const setQuickStake = (idx, amount) => {
    setBetSlipItems(prev => prev.map((item, i) => i === idx ? { ...item, stake: String(amount.toFixed(2)) } : item));
  };

  const totalStake = betSlipItems.reduce((sum, item) => sum + (parseFloat(item.stake) || 0), 0);
  const totalReturn = betSlipItems.reduce((sum, item) => {
    const stake = parseFloat(item.stake) || 0;
    const odds = parseFloat(item.horse.winOdds) || 1;
    return sum + stake * odds;
  }, 0);

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#0B0E1A', color: '#F1F5F9', fontFamily: "'Inter', sans-serif", userSelect: 'none' }}>

      {/* Left Sidebar */}
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
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-[#94A3B8] hover:bg-[#1A2235] hover:text-white rounded-md transition-colors group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M2 12h20"></path>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="font-medium text-[14px]">Home</span>
          </a>

          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-[#94A3B8] hover:bg-[#1A2235] hover:text-white rounded-md transition-colors group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
            <span className="font-medium text-[14px]">In-Play</span>
            <span className="ml-auto bg-[#1A2235] text-[#00C37B] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#1E293B]">LIVE</span>
          </a>

          <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-[#1A2235] text-white rounded-r-md border-l-[3px] border-[#00C37B] transition-colors relative">
            <div className="absolute inset-0 bg-[#00C37B] opacity-5 rounded-md pointer-events-none"></div>
            <span className="text-[18px]">🏇</span>
            <span className="font-bold text-[14px]">Horse Racing</span>
          </a>

          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-[#94A3B8] hover:bg-[#1A2235] hover:text-white rounded-md transition-colors group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            <span className="font-medium text-[14px]">Results</span>
          </a>

          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-[#94A3B8] hover:bg-[#1A2235] hover:text-white rounded-md transition-colors group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span className="font-medium text-[14px]">My Bets</span>
          </a>

          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-[#94A3B8] hover:bg-[#1A2235] hover:text-white rounded-md transition-colors group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100">
              <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"></path>
            </svg>
            <span className="font-medium text-[14px]">Account</span>
          </a>
        </nav>

        {isAuthenticated && user && (
          <div className="p-4 border-t border-[#1E293B] relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-3 w-full text-left hover:bg-[#1A2235] rounded-lg p-1.5 -m-1.5 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#00C37B] border border-[#1E293B] flex items-center justify-center text-[#0B0E1A] font-bold text-sm shrink-0">
                {getInitials(user.username)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-[13px] font-bold truncate">{user.username}</span>
                <span className="text-[#00C37B] text-[11px] font-mono">
                  {balance != null ? `${balance.toFixed(2)} CR` : '...'}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#64748B] shrink-0">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
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
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0B0E1A]">
        <header className="h-16 shrink-0 px-8 flex items-center justify-between border-b border-[#1E293B] bg-[#0B0E1A] z-10">
          <h1 className="text-[18px] font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-[#F59E0B]">🏇</span> Horse Racing
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#94A3B8] bg-[#1A2235] px-3 py-1.5 rounded-full border border-[#1E293B] cursor-pointer hover:border-[#00C37B] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span className="text-[12px] font-medium">Search horses, jockeys...</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Race Header */}
          <div className="bg-[#111827] border-b border-[#1E293B] px-8 py-6 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-[32px]">🏇</span>
                <div>
                  <h2 className="text-[24px] font-extrabold text-white tracking-tight leading-none">Cheltenham Racecourse</h2>
                  <div className="h-1 w-24 bg-gradient-to-r from-[#F59E0B] to-transparent mt-1 rounded-full"></div>
                </div>
              </div>
              <div className="bg-[#F59E0B] text-[#0B0E1A] text-[11px] font-extrabold px-3 py-1 rounded shadow-lg uppercase tracking-wider">
                Racing Today
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 text-[#94A3B8] text-[13px] font-medium">
              <span className="text-white">Race 4 of 7</span>
              <span className="text-[#334155] font-bold">·</span>
              <span>3:15 PM</span>
              <span className="text-[#334155] font-bold">·</span>
              <span>2m4f Hurdle</span>
              <span className="text-[#334155] font-bold">·</span>
              <span className="text-[#F59E0B]">Grade 1</span>
              <span className="text-[#334155] font-bold">·</span>
              <span>Good to Soft</span>
              <span className="text-[#334155] font-bold">·</span>
              <span>Prize Fund: 250,000 CR</span>
              <span className="text-[#334155] font-bold">·</span>
              <span>12 Runners</span>
            </div>

            <div className="mt-8 flex justify-center">
              <div
                className="border border-[rgba(245,158,11,0.5)] rounded-xl px-8 py-4 flex flex-col items-center backdrop-blur-sm relative overflow-hidden"
                style={{ background: 'rgba(245,158,11,0.08)', ...customStyles.glowAmber }}
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-50"></div>
                <span className="text-[#F59E0B] text-[11px] font-bold uppercase tracking-[0.2em] mb-1">Starts In</span>
                <div className="font-mono text-[48px] leading-none font-bold text-[#F59E0B] tabular-nums" style={customStyles.glowText}>
                  {formatCountdown(countdown)}
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 pb-12">
            {/* Race Tabs */}
            <div className="flex items-center gap-2 py-5 border-b border-[#1E293B] overflow-x-auto">
              {races.map((race, i) => {
                if (race.active) {
                  return (
                    <button
                      key={i}
                      className="shrink-0 px-5 py-2 rounded-full border-2 border-[#F59E0B] text-[#F59E0B] text-[13px] font-bold flex items-center gap-2 active-race-indicator"
                      style={{ background: 'rgba(245,158,11,0.15)', boxShadow: '0 0 15px rgba(245,158,11,0.2)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {race.label}
                    </button>
                  );
                } else if (race.done) {
                  return (
                    <button key={i} className="shrink-0 px-4 py-2 rounded-full text-[#00C37B] text-[13px] font-semibold flex items-center gap-1.5" style={{ background: 'rgba(0,195,123,0.1)', border: '1px solid rgba(0,195,123,0.3)' }}>
                      <span className="font-bold">{race.label}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                  );
                } else {
                  return (
                    <button key={i} className="shrink-0 px-4 py-2 rounded-full bg-[#1A2235] border border-[#1E293B] text-[#64748B] hover:text-[#94A3B8] hover:border-[#334155] text-[13px] font-semibold transition-colors">
                      {race.label}
                    </button>
                  );
                }
              })}
            </div>

            {/* Bet Type Tabs */}
            <div className="flex items-center gap-1 mt-6 mb-6 overflow-x-auto pb-1">
              {betTypeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveBetType(type)}
                  className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${activeBetType === type
                    ? 'bg-[#00C37B] text-[#0B0E1A] font-bold hover:bg-[#00a86b]'
                    : 'bg-[#1A2235] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#00C37B]'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Runners Table */}
            <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl overflow-hidden shadow-xl">
              <div className="bg-[#111827] border-b border-[#1E293B] px-5 py-3 grid gap-4 items-center" style={{ gridTemplateColumns: '50px 60px 1fr 130px 130px 90px 100px 100px 50px' }}>
                <div className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">No.</div>
                <div className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Silk</div>
                <div className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Horse Name</div>
                <div className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Jockey</div>
                <div className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Trainer</div>
                <div className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Form</div>
                <div className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Win Odds</div>
                <div className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">EW Odds</div>
                <div></div>
              </div>

              {horses.map((horse, index) => (
                <HorseRow key={horse.id} horse={horse} index={index} onAddToBetSlip={addToBetSlip} />
              ))}
            </div>

            {/* Race Info Footer */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 mt-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 pr-6 border-r border-[#1E293B]">
                  <span className="text-[#64748B] text-[13px] font-medium">📋 Each Way Terms:</span>
                  <span className="text-white text-[13px] font-bold">1/4 odds · Places 1-2-3</span>
                </div>
                <div className="text-[#94A3B8] text-[13px] pr-6 border-r border-[#1E293B]">SP available on all runners</div>

                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setShowNonRunners(!showNonRunners)}>
                  <span className="text-[#64748B] group-hover:text-white transition-colors text-[10px]">{showNonRunners ? '▼' : '▶'}</span>
                  <span className="text-[#94A3B8] group-hover:text-white transition-colors text-[13px]">Non Runners</span>
                  <span className="bg-[#F59E0B] text-[#0B0E1A] text-[10px] font-bold px-1.5 rounded-full">2</span>
                </div>

                <div className="flex items-center gap-2 cursor-pointer group ml-4" onClick={() => setShowRule4(!showRule4)}>
                  <span className="text-[#64748B] group-hover:text-white transition-colors text-[10px]">{showRule4 ? '▼' : '▶'}</span>
                  <span className="text-[#94A3B8] group-hover:text-white transition-colors text-[13px]">Rule 4 Deductions</span>
                </div>
              </div>

              {showNonRunners && (
                <div className="mt-3 pt-3 border-t border-[#1E293B] text-[#94A3B8] text-[13px]">
                  <p>• <span className="text-white font-medium">Arkle's Pride</span> — Withdrawn (Vet Advice)</p>
                  <p>• <span className="text-white font-medium">Storm Dancer</span> — Withdrawn (Going)</p>
                </div>
              )}
              {showRule4 && (
                <div className="mt-3 pt-3 border-t border-[#1E293B] text-[#94A3B8] text-[13px]">
                  <p>Rule 4 deductions apply: 5p in the £ on all win and each-way bets due to non-runners.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Bet Slip */}
      <aside className="w-[320px] bg-[#111827] border-l border-[#1E293B] flex flex-col shrink-0 z-20">
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-[15px]">Bet Slip</span>
            <span className="bg-[#F59E0B] text-[#0B0E1A] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Horse Racing</span>
          </div>
          <div className="text-[#00C37B] bg-[rgba(0,195,123,0.1)] rounded-full w-6 h-6 flex items-center justify-center font-bold text-[12px]">
            {betSlipItems.length}
          </div>
        </div>

        <div className="flex border-b border-[#1E293B]">
          {['Singles', 'Each Way', 'Multiples'].map(tab => (
            <button
              key={tab}
              onClick={() => setBetSlipTab(tab)}
              className={`flex-1 py-3 text-[13px] transition-colors ${betSlipTab === tab
                ? 'text-[#00C37B] font-bold border-b-2 border-[#00C37B]'
                : 'text-[#64748B] font-medium hover:text-white hover:bg-[#1A2235]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {betSlipItems.length === 0 && (
            <div className="text-center text-[#64748B] text-[13px] mt-8">
              <p>Your bet slip is empty.</p>
              <p className="mt-1 text-[11px]">Click the odds buttons to add selections.</p>
            </div>
          )}
          {betSlipItems.map((item, idx) => {
            const stake = parseFloat(item.stake) || 0;
            const odds = parseFloat(item.horse.winOdds) || 1;
            const returns = (stake * odds).toFixed(2);
            return (
              <div key={idx} className="bg-[#1A2235] border border-[#1E293B] rounded-lg p-4 relative group">
                <button
                  onClick={() => removeFromBetSlip(idx)}
                  className="absolute top-2 right-2 text-[#64748B] hover:text-[#EF4444] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-[14px]">{item.horse.name.toUpperCase()}</span>
                  <span className="bg-[rgba(0,195,123,0.15)] text-[#00C37B] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">{item.type}</span>
                </div>

                <div className="text-[#64748B] text-[11px] mb-3">Race 4 · Cheltenham · 3:15 PM</div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#94A3B8] text-[12px] font-medium">Win Odds:</span>
                  <span className="text-[#F59E0B] font-mono font-bold text-[18px]">{item.horse.winOdds}</span>
                </div>

                <div className="bg-[#0B0E1A] border border-[#1E293B] rounded p-2 mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#64748B] text-[11px]">Stake (CR)</span>
                    <span className="text-[#94A3B8] font-mono text-[12px]">Balance: 2,450.50</span>
                  </div>
                  <input
                    type="text"
                    value={item.stake}
                    onChange={(e) => updateStake(idx, e.target.value)}
                    className="w-full bg-transparent text-right text-white font-mono font-bold outline-none border-none p-0 focus:ring-0"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1 mb-3">
                  {[5, 10, 25, 50].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setQuickStake(idx, amount)}
                      className="bg-[#111827] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#64748B] text-[11px] py-1 rounded transition-colors"
                    >
                      {amount} CR
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#1E293B]">
                  <span className="text-white text-[13px]">To Return:</span>
                  <span className="text-[#00C37B] font-mono font-bold text-[16px]">{returns} CR</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-[#111827] border-t border-[#1E293B]">
          <div className="flex justify-between items-center mb-4 text-[13px]">
            <span className="text-[#94A3B8]">Total Stake:</span>
            <span className="text-white font-mono font-bold">{totalStake.toFixed(2)} CR</span>
          </div>
          <div className="flex justify-between items-center mb-4 text-[13px]">
            <span className="text-[#94A3B8]">Est. Returns:</span>
            <span className="text-[#00C37B] font-mono font-bold">{totalReturn.toFixed(2)} CR</span>
          </div>
          <button
            className="w-full bg-[#00C37B] hover:bg-[#00a86b] text-black font-extrabold text-[15px] py-3.5 rounded-lg uppercase tracking-wide transition-all"
            style={{ boxShadow: '0 4px 12px rgba(0,195,123,0.2)' }}
            onClick={() => {
              if (betSlipItems.length > 0) {
                alert(`Bet placed! Total stake: ${totalStake.toFixed(2)} CR · Est. returns: ${totalReturn.toFixed(2)} CR`);
                setBetSlipItems([]);
              }
            }}
          >
            Place Bet
          </button>
          <div className="text-center mt-3 text-[#475569] text-[11px]">
            Odds may change. Terms &amp; Conditions apply.
          </div>
        </div>
      </aside>
    </div>
  );
};

export default App;