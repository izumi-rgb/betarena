'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

type LogRow = {
  id: number;
  action: string;
  result: string;
  role?: string;
  username?: string;
  display_id?: string;
  ip_address?: string;
  created_at: string;
  notes?: string;
};

type LogsEnvelope = { logs: LogRow[]; total: number };

function isThreatRow(log: LogRow): boolean {
  const action = (log.action || '').toLowerCase();
  const result = (log.result || '').toLowerCase();
  return (
    action.includes('sqli') ||
    action.includes('sql') ||
    action.includes('xss') ||
    action.includes('shell') ||
    action.includes('inject') ||
    action.includes('blocked') ||
    action.includes('brute') ||
    result === 'blocked' ||
    result === 'fail'
  );
}

function StatusPill({ result }: { result: string }) {
  const r = (result || '').toLowerCase();
  if (r === 'blocked' || r === 'fail' || r === 'error') {
    return <span className="bg-[#7f1d1d] text-[#EF4444] border border-[#EF4444] text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">BLOCKED</span>;
  }
  if (r === 'warning' || r === 'warn') {
    return <span className="bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] text-[10px] px-2 py-0.5 rounded-full font-bold">WARNING</span>;
  }
  return <span className="bg-[rgba(0,195,123,0.12)] text-[#00C37B] border border-[rgba(0,195,123,0.3)] text-[10px] px-2 py-0.5 rounded-full font-bold">SUCCESS</span>;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function AdminLogsPage() {
  const [filters, setFilters] = useState({
    user: '',
    actionType: '',
    ip: '',
    dateFrom: '',
    dateTo: '',
    threatsOnly: false,
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (appliedFilters.user) params.set('user', appliedFilters.user);
    if (appliedFilters.actionType) params.set('action_type', appliedFilters.actionType);
    if (appliedFilters.ip) params.set('ip', appliedFilters.ip);
    if (appliedFilters.dateFrom) params.set('date_from', appliedFilters.dateFrom);
    if (appliedFilters.dateTo) params.set('date_to', appliedFilters.dateTo);
    return `/api/admin/logs?${params.toString()}`;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs', page, appliedFilters],
    queryFn: () => apiGet<LogsEnvelope>(buildQuery()).then((r) => r.data || { logs: [], total: 0 }),
  });

  const allLogs = data?.logs || [];
  const total = data?.total || 0;

  const visibleLogs = appliedFilters.threatsOnly ? allLogs.filter(isThreatRow) : allLogs;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const exportCSV = useCallback(() => {
    if (visibleLogs.length === 0) return;
    const header = 'Timestamp,User,Action,IP Address,Status,Notes';
    const rows = visibleLogs.map((log) => {
      const ts = fmtDate(log.created_at);
      const user = log.display_id || log.username || 'Unknown';
      const action = (log.action || '').replace(/"/g, '""');
      const ip = log.ip_address || '';
      const status = log.result || '';
      const notes = (log.notes || '').replace(/"/g, '""');
      return `"${ts}","${user}","${action}","${ip}","${status}","${notes}"`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [visibleLogs]);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyFilters();
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100vh' }}>
      {/* Page Header */}
      <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4 w-1/4">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
            <div className="text-[20px] font-extrabold tracking-tight text-white leading-none">
              BET<span className="text-[#00C37B]">ARENA</span>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-[#1E293B] mx-2" />
          <div className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">System Logs Auditor</div>
        </div>

        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#00C37B]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <h1 className="text-white font-bold text-[16px]">Advanced System Logs</h1>
        </div>

        <div className="flex items-center justify-end gap-6 w-1/4">
          <button
            onClick={exportCSV}
            disabled={visibleLogs.length === 0}
            className="text-[#64748B] hover:text-white text-[13px] font-medium flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-2 border-[#1E293B]" />
        </div>
      </header>

      <main className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
        {/* Filter Bar */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {/* Search User */}
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">Search User</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.user}
                  onChange={(e) => setFilters((f) => ({ ...f, user: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Username or ID..."
                  className="w-full bg-[#0B0E1A] border border-[#1E293B] text-[#F1F5F9] text-[12px] py-1.5 pl-8 pr-3 rounded-md focus:outline-none focus:border-[#00C37B]"
                />
                <svg className="absolute left-2.5 top-2.5 text-[#64748B]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {/* Action Type */}
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">Action Type</label>
              <select
                value={filters.actionType}
                onChange={(e) => setFilters((f) => ({ ...f, actionType: e.target.value }))}
                className="w-full bg-[#0B0E1A] border border-[#1E293B] text-[#F1F5F9] text-[12px] py-1.5 px-3 rounded-md focus:outline-none focus:border-[#00C37B] appearance-none cursor-pointer"
              >
                <option value="">All Actions</option>
                <option value="auth">Auth Events</option>
                <option value="credit">Credit Transfers</option>
                <option value="bet">Bet Placements</option>
                <option value="system">System Config</option>
              </select>
            </div>

            {/* IP Address */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">IP Address</label>
              <input
                type="text"
                value={filters.ip}
                onChange={(e) => setFilters((f) => ({ ...f, ip: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="0.0.0.0"
                className="w-full bg-[#0B0E1A] border border-[#1E293B] text-[#F1F5F9] text-[12px] py-1.5 px-3 rounded-md font-mono focus:outline-none focus:border-[#00C37B]"
              />
            </div>

            {/* Date Range */}
            <div className="flex flex-col gap-1.5 min-w-[240px]">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                  className="flex-1 bg-[#0B0E1A] border border-[#1E293B] text-[#F1F5F9] text-[12px] py-1.5 px-3 rounded-md focus:outline-none focus:border-[#00C37B]"
                />
                <span className="text-[#64748B] text-[10px]">to</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                  className="flex-1 bg-[#0B0E1A] border border-[#1E293B] text-[#F1F5F9] text-[12px] py-1.5 px-3 rounded-md focus:outline-none focus:border-[#00C37B]"
                />
              </div>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-[#1E293B] mx-6" />

          <div className="flex items-center gap-4">
            {/* Threats Only */}
            <button
              onClick={() => setFilters((f) => ({ ...f, threatsOnly: !f.threatsOnly }))}
              className={`px-5 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-2 transition-all ${
                filters.threatsOnly
                  ? 'bg-[#EF4444] bg-opacity-20 border border-[#EF4444] text-[#EF4444]'
                  : 'bg-[#EF4444] bg-opacity-10 border border-[#EF4444] border-opacity-30 text-[#EF4444] hover:bg-opacity-20'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              Threats Only
            </button>
            {/* Apply Filters */}
            <button
              onClick={applyFilters}
              className="bg-[#00C37B] text-[#0B0E1A] px-6 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#00e691] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 bg-[#111827] border border-[#1E293B] rounded-xl flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1E293B transparent' }}>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#0B0E1A] border-b border-[#1E293B]">
                <tr>
                  <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider w-48">Timestamp</th>
                  <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider w-40">User</th>
                  <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider w-48">Action Type</th>
                  <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider w-40">IP Address</th>
                  <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider w-32">Status</th>
                  <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Detection / Notes</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-8 px-6 text-[#64748B]">Loading logs...</td></tr>
                ) : visibleLogs.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 px-6 text-[#64748B]">No logs found.</td></tr>
                ) : (
                  visibleLogs.map((log) => {
                    const threat = isThreatRow(log);
                    return (
                      <tr
                        key={log.id}
                        className={`border-b ${threat ? 'border-[#7f1d1d]' : 'border-[#1E293B] hover:bg-white/5'}`}
                        style={threat ? {
                          backgroundColor: 'rgba(127,29,29,0.2)',
                          borderLeft: '4px solid #EF4444',
                        } : undefined}
                      >
                        <td className={`py-4 px-6 font-mono text-[12px] ${threat ? 'text-[#FCA5A5] font-semibold' : 'text-[#64748B]'}`}>
                          {fmtDate(log.created_at)}
                        </td>
                        <td className="py-4 px-6">
                          {threat ? (
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold italic">{log.display_id || log.username || 'Unknown'}</span>
                              <span className="bg-[#7f1d1d] text-[9px] px-1.5 py-0.5 rounded text-white border border-[#EF4444]">UNAUTH</span>
                            </div>
                          ) : (
                            <span className="text-white font-medium">{log.display_id || log.username || '—'}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-mono ${threat ? 'text-[#EF4444] font-bold uppercase' : 'text-[#94A3B8]'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className={`py-4 px-6 font-mono text-[12px] ${threat ? 'text-[#FCA5A5]' : 'text-[#64748B]'}`}>
                          {log.ip_address || '—'}
                        </td>
                        <td className="py-4 px-6">
                          <StatusPill result={log.result} />
                        </td>
                        <td className="py-4 px-6">
                          {threat ? (
                            <div className="flex items-center gap-3">
                              <span className="text-[16px]" style={{ animation: 'pulse-red 1.5s infinite ease-in-out' }}>🚨</span>
                              <span className="text-[#FCA5A5] font-medium italic text-[12px]">
                                {log.notes || 'Security threat detected'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#64748B] text-[12px]">{log.notes || '—'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="h-14 bg-[#0B0E1A] border-t border-[#1E293B] px-6 flex items-center justify-between shrink-0">
            <div className="text-[12px] text-[#64748B]">
              Showing <span className="text-white font-bold">{total === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</span> of{' '}
              <span className="text-white font-bold">{total.toLocaleString()}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded bg-[#1A2235] flex items-center justify-center text-[#64748B] hover:text-white border border-[#1E293B] disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className="flex items-center">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded font-bold text-[12px] ${
                      p === page ? 'bg-[#00C37B] text-[#0B0E1A]' : 'text-[#64748B] hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > 3 && (
                  <>
                    <span className="text-[#64748B] mx-1">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`w-8 h-8 rounded font-bold text-[12px] ${
                        page === totalPages ? 'bg-[#00C37B] text-[#0B0E1A]' : 'text-[#64748B] hover:text-white'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded bg-[#1A2235] flex items-center justify-center text-[#64748B] hover:text-white border border-[#1E293B] disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse-red {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
