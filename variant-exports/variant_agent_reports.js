import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const customStyles = {
  root: {
    '--bg-primary': '#0B0E1A',
    '--bg-secondary': '#111827',
    '--surface': '#1A2235',
    '--surface-hover': '#232d42',
    '--border': '#1E293B',
    '--accent': '#00C37B',
    '--accent-dim': 'rgba(0, 195, 123, 0.1)',
    '--amber': '#F59E0B',
    '--danger': '#EF4444',
    '--blue': '#3B82F6',
    '--text-primary': '#F1F5F9',
    '--text-secondary': '#94A3B8',
    '--text-tertiary': '#64748B',
  }
};

const Sidebar = ({ pathname }) => {
  const navItems = [
    {
      id: 'dashboard', label: 'Dashboard', href: '/dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    {
      id: 'members', label: 'My Members', href: '/members',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      id: 'subagents', label: 'Sub-Agents', href: '/sub-agents',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
          <path d="M10 7h4"></path><path d="M7 14v-4"></path><path d="M14 17h-4"></path>
        </svg>
      )
    },
    {
      id: 'credits', label: 'Credits', href: '/credits',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
          <path d="M12 18V6"></path>
        </svg>
      )
    },
    {
      id: 'reports', label: 'Reports', href: '/reports',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    },
  ];

  const navItemStyle = (href) => {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    marginBottom: '4px',
    borderRadius: '6px',
    color: isActive ? '#00C37B' : '#94A3B8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: isActive ? '3px solid #00C37B' : '3px solid transparent',
    backgroundColor: isActive ? '#1E2D45' : 'transparent',
    textDecoration: 'none',
  });
  };

  return (
    <aside style={{ backgroundColor: '#111827', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#00C37B">
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"></path>
          </svg>
          <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: 'white' }}>
            BET<span style={{ color: '#00C37B' }}>ARENA</span>
          </div>
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#1E293B', width: '100%', marginBottom: '16px' }}></div>

      <div style={{ padding: '0 16px', marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', padding: '0 8px' }}>Main Menu</div>
        {navItems.map(item => (
          <Link
            key={item.id}
            to={item.href}
            style={navItemStyle(item.href)}
            onMouseEnter={e => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#1A2235';
                e.currentTarget.style.color = '#F1F5F9';
              }
            }}
            onMouseLeave={e => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94A3B8';
              }
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '0 16px 16px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', marginBottom: '16px', borderRadius: '6px', color: '#94A3B8', fontSize: '14px', fontWeight: '500', cursor: 'pointer', borderLeft: '3px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1A2235'; e.currentTarget.style.color = '#F1F5F9'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </div>
        <div style={{ backgroundColor: '#0B0E1A', border: '1px solid #1E293B', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', border: '1px solid #1A2235', flexShrink: 0 }}></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Agent_20</div>
            <div style={{ color: '#64748B', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Master Agent</div>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', flexShrink: 0 }}></div>
        </div>
      </div>
    </aside>
  );
};

const KpiCard = ({ dotColor, label, value, unit, sub, isGlow }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        backgroundColor: '#1A2235',
        border: isGlow ? '1px solid rgba(0, 195, 123, 0.3)' : '1px solid #1E293B',
        borderRadius: '12px',
        padding: '20px',
        transition: 'transform 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isGlow ? '0 0 15px rgba(0, 195, 123, 0.15)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor, animation: isGlow ? 'pulse 2s infinite' : 'none' }}></div>
        {label}
      </div>
      <div style={{ fontFamily: 'Roboto Mono, monospace', fontSize: '28px', fontWeight: '700', color: dotColor, marginBottom: '4px' }}>
        {value} <span style={{ fontSize: '16px', opacity: 0.7 }}>{unit}</span>
      </div>
      {isGlow ? (
        <div style={{ fontSize: '11px', color: '#00C37B', backgroundColor: 'rgba(0,195,123,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>{sub}</div>
      ) : (
        <div style={{ fontSize: '11px', color: '#64748B' }}>{sub}</div>
      )}
    </div>
  );
};

const MemberRow = ({ member, onViewProfile }) => {
  const [hovered, setHovered] = useState(false);
  const isSuspended = member.suspended;

  return (
    <tr
      style={{
        transition: 'background-color 0.15s',
        borderBottom: '1px solid #1E293B',
        backgroundColor: hovered
          ? isSuspended ? 'rgba(239, 68, 68, 0.12)' : '#232d42'
          : isSuspended ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={{ padding: '16px 24px', fontFamily: 'Roboto Mono, monospace', color: isSuspended ? '#EF4444' : '#94A3B8' }}>{member.id}</td>
      <td style={{ padding: '16px 24px', color: isSuspended ? '#EF4444' : 'white', fontWeight: '500' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: member.avatarBg, color: member.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>
            {member.initials}
          </div>
          {member.name}
        </div>
      </td>
      <td style={{ padding: '16px 24px', fontFamily: 'Roboto Mono, monospace', color: '#94A3B8' }}>{member.given}</td>
      <td style={{ padding: '16px 24px', fontFamily: 'Roboto Mono, monospace', color: '#94A3B8' }}>{member.wonBack}</td>
      <td style={{ padding: '16px 24px', fontFamily: 'Roboto Mono, monospace', color: member.plPositive ? '#00C37B' : '#EF4444', fontWeight: '700' }}>{member.pl}</td>
      <td style={{ padding: '16px 24px', fontFamily: 'Roboto Mono, monospace', color: '#94A3B8' }}>{member.bets}</td>
      <td style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '13px' }}>
          <div style={{ width: '64px', height: '6px', backgroundColor: '#111827', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: member.winBarColor, width: member.winPct }}></div>
          </div>
          {member.winPct}
        </div>
      </td>
      <td style={{ padding: '16px 24px', color: '#94A3B8', fontSize: '13px' }}>
        {isSuspended ? (
          <span style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#F87171', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid rgba(239,68,68,0.3)' }}>Suspended</span>
        ) : member.lastActive}
      </td>
      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
        <button
          onClick={() => onViewProfile(member)}
          style={{
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s',
            color: '#00C37B',
            fontSize: '11px',
            fontWeight: '700',
            border: '1px solid #00C37B',
            borderRadius: '4px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#00C37B'; e.currentTarget.style.color = 'black'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#00C37B'; }}
        >
          View Full Profile →
        </button>
      </td>
    </tr>
  );
};

const ProfileModal = ({ member, onClose }) => {
  if (!member) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#1A2235', border: '1px solid #1E293B', borderRadius: '16px', padding: '32px', width: '400px', maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>Member Profile</h2>
          <button onClick={onClose} style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: member.avatarBg, color: member.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' }}>
            {member.initials}
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>{member.name}</div>
            <div style={{ color: '#64748B', fontSize: '13px' }}>ID: {member.id}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'Credits Given', value: member.given, color: '#F59E0B' },
            { label: 'Won Back', value: member.wonBack, color: '#00C37B' },
            { label: 'P&L', value: member.pl, color: member.plPositive ? '#00C37B' : '#EF4444' },
            { label: 'Total Bets', value: member.bets, color: 'white' },
            { label: 'Win Rate', value: member.winPct, color: member.winBarColor },
            { label: 'Last Active', value: member.suspended ? 'Suspended' : member.lastActive, color: member.suspended ? '#EF4444' : '#94A3B8' },
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ color: item.color, fontSize: '16px', fontWeight: '700', fontFamily: 'Roboto Mono, monospace' }}>{item.value}</div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ marginTop: '24px', width: '100%', padding: '10px', backgroundColor: '#00C37B', color: 'black', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const ReportsPage = () => {
  const [timePeriod, setTimePeriod] = useState('Last 30 Days');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const members = [
    { id: '20_1', name: 'John K.', initials: 'JK', avatarBg: 'rgba(59,130,246,0.2)', avatarColor: '#60A5FA', given: '800 CR', wonBack: '925 CR', pl: '+125', plPositive: true, bets: 23, winPct: '61%', winBarColor: '#00C37B', lastActive: 'Today', suspended: false },
    { id: '20_2', name: 'Mike R.', initials: 'MR', avatarBg: 'rgba(168,85,247,0.2)', avatarColor: '#C084FC', given: '300 CR', wonBack: '255 CR', pl: '-45', plPositive: false, bets: 8, winPct: '38%', winBarColor: '#F59E0B', lastActive: '2d ago', suspended: false },
    { id: '20_3', name: 'Sarah M.', initials: 'SM', avatarBg: 'rgba(236,72,153,0.2)', avatarColor: '#F472B6', given: '1,200 CR', wonBack: '1,520 CR', pl: '+320', plPositive: true, bets: 47, winPct: '68%', winBarColor: '#00C37B', lastActive: 'Today', suspended: false },
    { id: '20_4', name: 'David L.', initials: 'DL', avatarBg: 'rgba(239,68,68,0.2)', avatarColor: '#F87171', given: '500 CR', wonBack: '0 CR', pl: '-500', plPositive: false, bets: 12, winPct: '0%', winBarColor: '#111827', lastActive: '', suspended: true },
    { id: '20_5', name: 'Anna P.', initials: 'AP', avatarBg: 'rgba(20,184,166,0.2)', avatarColor: '#2DD4BF', given: '450 CR', wonBack: '500 CR', pl: '+50', plPositive: true, bets: 15, winPct: '53%', winBarColor: '#F59E0B', lastActive: '1d ago', suspended: false },
  ];

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const sparkHeights = [30, 45, 35, 60, 50, 75, 65, 40, 55, 70, 85, 60, 45, 90];

  return (
    <main style={{ backgroundColor: '#0B0E1A', overflowY: 'auto', padding: '32px 40px', flex: 1 }}>
      {selectedMember && <ProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          <span>📊</span> Reports &amp; Analytics
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={timePeriod}
              onChange={e => setTimePeriod(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none', backgroundColor: '#111827', color: 'white', border: '1px solid #1E293B', borderRadius: '6px', padding: '8px 40px 8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', outline: 'none' }}
            >
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>Last Month</option>
            </select>
            <div style={{ pointerEvents: 'none', position: 'absolute', inset: '0', right: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '12px' }}>
              <svg style={{ height: '16px', width: '16px', color: '#64748B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #00C37B', color: exportSuccess ? 'black' : '#00C37B', backgroundColor: exportSuccess ? '#00C37B' : 'rgba(0,195,123,0.05)', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {exportSuccess ? '✓ Exported!' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <KpiCard dotColor="#F59E0B" label="Credits Distributed" value="3,750" unit="CR" sub="To 24 members" />
        <KpiCard dotColor="#00C37B" label="Member Winnings" value="1,240" unit="CR" sub="Paid out" />
        <KpiCard dotColor="#EF4444" label="Member Losses" value="1,582" unit="CR" sub="Retained" />
        <KpiCard dotColor="#00C37B" label="Net House P&L" value="+342" unit="CR" sub="▲ 12.5%" isGlow />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', margin: 0 }}>Credit Distribution — {timePeriod}</h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#00C37B', opacity: 0.5 }}></div>Given Out
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#F59E0B', opacity: 0.5 }}></div>Won Back
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#EF4444', opacity: 0.5 }}></div>Kept
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: '240px' }}>
            <svg viewBox="0 0 600 240" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradGreen" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00C37B" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#00C37B" stopOpacity="0.05"></stop>
                </linearGradient>
                <linearGradient id="gradAmber" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05"></stop>
                </linearGradient>
                <linearGradient id="gradRed" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.05"></stop>
                </linearGradient>
              </defs>
              <g>
                <line x1="0" y1="60" x2="600" y2="60" stroke="#2D3748" strokeDasharray="4"></line>
                <line x1="0" y1="120" x2="600" y2="120" stroke="#2D3748" strokeDasharray="4"></line>
                <line x1="0" y1="180" x2="600" y2="180" stroke="#2D3748" strokeDasharray="4"></line>
              </g>
              <path d="M0,180 Q100,100 200,140 T400,100 T600,150 V240 H0 Z" fill="url(#gradGreen)" stroke="none"></path>
              <path d="M0,180 Q100,100 200,140 T400,100 T600,150" fill="none" stroke="#00C37B" strokeWidth="2"></path>
              <path d="M0,200 Q100,150 200,180 T400,160 T600,190 V240 H0 Z" fill="url(#gradAmber)" stroke="none"></path>
              <path d="M0,200 Q100,150 200,180 T400,160 T600,190" fill="none" stroke="#F59E0B" strokeWidth="2"></path>
              <path d="M0,220 Q100,200 200,210 T400,190 T600,210 V240 H0 Z" fill="url(#gradRed)" stroke="none"></path>
              <path d="M0,220 Q100,200 200,210 T400,190 T600,210" fill="none" stroke="#EF4444" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>Bet Type Breakdown</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <svg width="200" height="200" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00C37B" strokeWidth="12" strokeDasharray="125 251" transform="rotate(-90 50 50)"></circle>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="97 251" transform="rotate(90 50 50)"></circle>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="33 251" transform="rotate(220 50 50)"></circle>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#64748B" strokeWidth="12" strokeDasharray="22 251" transform="rotate(265 50 50)"></circle>
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Total</div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>342</div>
              <div style={{ color: '#64748B', fontSize: '10px' }}>bets</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            {[
              { color: '#00C37B', label: 'Singles', pct: '45%' },
              { color: '#F59E0B', label: 'Accas', pct: '35%' },
              { color: '#3B82F6', label: 'System', pct: '12%' },
              { color: '#64748B', label: 'Other', pct: '8%' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }}></div>
                <span style={{ color: '#94A3B8' }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', color: 'white', fontWeight: '700' }}>{item.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1A2235', border: '1px solid #1E293B', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', margin: 0 }}>Member Breakdown</h3>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search member..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ backgroundColor: '#0B0E1A', border: '1px solid #1E293B', borderRadius: '6px', padding: '6px 16px 6px 32px', fontSize: '14px', color: 'white', outline: 'none', width: '192px' }}
            />
            <svg style={{ position: 'absolute', left: '10px', top: '8px', width: '16px', height: '16px', color: '#64748B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#161d30', borderBottom: '1px solid #1E293B' }}>
              {['ID', 'Nickname', 'Given', 'Won Back', 'P&L', 'Bets', 'Win%', 'Last Active', ''].map((h, i) => (
                <th key={i} style={{ padding: '12px 24px', color: '#64748B', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px', color: '#94A3B8' }}>
            {filteredMembers.map(member => (
              <MemberRow key={member.id} member={member} onViewProfile={setSelectedMember} />
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>No members found matching "{searchTerm}"</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#1A2235', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>Top Sports by Volume</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { name: 'Football', value: '2,340 CR', pct: '85%', color: '#00C37B' },
              { name: 'Basketball', value: '890 CR', pct: '45%', color: '#F59E0B' },
              { name: 'Tennis', value: '560 CR', pct: '30%', color: '#3B82F6' },
              { name: 'Cricket', value: '290 CR', pct: '15%', color: '#64748B' },
            ].map((sport, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'white' }}>{sport.name}</span>
                  <span style={{ color: '#00C37B', fontFamily: 'Roboto Mono, monospace' }}>{sport.value}</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#111827', height: '8px', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: sport.color, height: '100%', borderRadius: '9999px', width: sport.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#1A2235', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>Daily Bet Volume (14d)</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', height: '128px', padding: '0 8px' }}>
            {sparkHeights.map((h, i) => {
              const isLast = i === sparkHeights.length - 1;
              return (
                <div
                  key={i}
                  title={isLast ? 'Today' : `${sparkHeights.length - 1 - i} days ago`}
                  style={{
                    flex: 1,
                    backgroundColor: '#00C37B',
                    borderRadius: '2px 2px 0 0',
                    opacity: isLast ? 1 : 0.6,
                    height: `${h}%`,
                    transition: 'height 0.3s ease',
                    boxShadow: isLast ? '0 0 10px #00C37B' : 'none',
                    cursor: 'default',
                  }}
                ></div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: '#64748B' }}>
            <span>14 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </main>
  );
};

const App = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/reports';

  useEffect(() => {
    document.body.style.backgroundColor = '#0B0E1A';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = "'Inter', sans-serif";
    document.body.style.color = '#F1F5F9';
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #0B0E1A; }
      ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #64748B; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Router basename="/">
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100vh', overflow: 'hidden' }}>
        <Sidebar pathname={pathname} />
        <ReportsPage />
      </div>
    </Router>
  );
};

export default App;
