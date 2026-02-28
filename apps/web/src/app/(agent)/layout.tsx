'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(`${href}/`);
  return (
    <Link href={href} className={`block rounded-lg px-3 py-2 text-sm ${active ? 'bg-[#1A2235] text-[#00C37B]' : 'text-[#CBD5E1] hover:bg-[#111827]'}`}>
      {label}
    </Link>
  );
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchMe } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) fetchMe();
  }, [isAuthenticated, isLoading, fetchMe]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'agent' && user.role !== 'sub_agent') {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/sports');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user || (user.role !== 'agent' && user.role !== 'sub_agent')) return null;

  return (
    <div className="min-h-screen bg-[#0B0E1A] text-white">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-[#1E293B] bg-[#111827] p-4">
          <div className="mb-6 text-lg font-extrabold text-[#00C37B]">BETARENA AGENT</div>
          <nav className="space-y-1">
            <NavItem href="/agent/dashboard" label="Dashboard" />
            <NavItem href="/agent/members" label="Members" />
            <NavItem href="/agent/sub-agents" label="Sub-Agents" />
            <NavItem href="/agent/credits" label="Credits" />
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
