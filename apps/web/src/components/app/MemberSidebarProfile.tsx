'use client';

type MemberSidebarProfileProps = {
  initials: string;
  username: string;
  balanceLabel: string;
  onClick?: () => void;
};

export function MemberSidebarProfile({
  initials,
  username,
  balanceLabel,
  onClick,
}: MemberSidebarProfileProps) {
  const content = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00C37B] text-sm font-extrabold text-[#0B0E1A]">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold leading-4 text-white">{username}</div>
        <div className="mt-1 font-mono text-[11px] font-bold leading-3 text-[#00C37B]">{balanceLabel}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#64748B]">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-md border border-[#1E293B] bg-[#111827] px-3 py-3 text-left transition-colors hover:bg-[#1A2235]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-md border border-[#1E293B] bg-[#111827] px-3 py-3">
      {content}
    </div>
  );
}
