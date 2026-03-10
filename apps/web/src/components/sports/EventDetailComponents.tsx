'use client';

import React, { useState } from 'react';

/* ─── LiveBadge ─── */
export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EF4444]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#EF4444]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" /> Live
    </span>
  );
}

/* ─── OddsButton ─── */
export type OddsButtonProps = {
  label: string;
  odds: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function OddsButton({ label, odds, active, onClick, disabled }: OddsButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-center transition-all ${
        disabled
          ? 'cursor-not-allowed border-[#1E293B] bg-[#0B0E1A]/40 text-[#64748B]'
          : active
            ? 'border-[#00C37B] bg-[#00C37B]/15 text-[#00C37B]'
            : 'border-[#1E293B] bg-[#0B0E1A] text-white hover:border-[#00C37B]/60'
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</div>
      <div className="mt-0.5 font-mono text-[15px] font-bold text-[#F59E0B]">{odds.toFixed(2)}</div>
    </button>
  );
}

/* ─── StatCard ─── */
export type StatCardProps = {
  label: string;
  home: number;
  away: number;
};

export function StatCard({ label, home, away }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[#1E293B] bg-[#111827] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-[#64748B]">{label}</div>
      <div className="mt-1 flex items-center justify-between font-mono text-sm font-bold text-white">
        <span>{home}</span>
        <span className="text-[#334155]">|</span>
        <span>{away}</span>
      </div>
    </div>
  );
}

/* ─── MarketAccordion ─── */
export type MarketAccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function MarketAccordion({ title, children, defaultOpen = true }: MarketAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235]">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[#94A3B8]">{open ? '\u2212' : '+'}</span>
      </button>
      {open ? <div className="border-t border-[#1E293B] p-3">{children}</div> : null}
    </div>
  );
}
