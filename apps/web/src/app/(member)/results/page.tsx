'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

type ResultEvent = {
  id: number;
  sport: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  score: { home: number; away: number };
  status: string;
  startsAt: string;
};

async function fetchResults(): Promise<ResultEvent[]> {
  const res = await apiGet<ResultEvent[]>('/api/results');
  return res.data || [];
}

function sportLabel(sport: string) {
  return sport.charAt(0).toUpperCase() + sport.slice(1);
}

export default function ResultsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['results'],
    queryFn: fetchResults,
    refetchInterval: 60_000,
  });

  const results = data || [];

  return (
    <div className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-white">Results</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Recently settled matches and final scores.</p>
        </header>

        {isLoading && (
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-6 text-center text-sm text-[#94A3B8]">
            Loading results…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
            Failed to load results. Please try again.
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#111827] p-12 text-center text-[#94A3B8]">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-semibold text-white">No results today</div>
            <div className="mt-1 text-sm">Settled matches will appear here once events finish.</div>
          </div>
        )}

        {results.length > 0 && (
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] overflow-hidden">
            <div className="grid grid-cols-5 gap-3 border-b border-[#1E293B] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              <div>Sport</div>
              <div>Competition</div>
              <div className="col-span-2">Match</div>
              <div className="text-right">Score</div>
            </div>
            {results.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-5 gap-3 border-b border-[#1E293B] px-4 py-3 text-sm last:border-b-0 hover:bg-[#1A2235]/40"
              >
                <div className="text-[#94A3B8]">{sportLabel(r.sport)}</div>
                <div className="truncate text-[#94A3B8]">{r.competition || '—'}</div>
                <div className="col-span-2 font-medium text-white">
                  {r.homeTeam} vs {r.awayTeam}
                </div>
                <div className="text-right font-mono font-bold text-[#F59E0B]">
                  {r.score.home} – {r.score.away}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
