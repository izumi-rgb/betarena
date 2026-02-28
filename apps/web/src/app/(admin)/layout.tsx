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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) fetchMe();
  }, [isAuthenticated, isLoading, fetchMe]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace(user.role === 'agent' || user.role === 'sub_agent' ? '/agent/dashboard' : '/sports');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-[#0B0E1A] text-white">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-[#1E293B] bg-[#111827] p-4">
          <div className="mb-6 text-lg font-extrabold text-[#00C37B]">BETARENA</div>
          <nav className="space-y-1">
            <NavItem href="/admin/dashboard" label="Dashboard" />
            <NavItem href="/admin/credits" label="Credit Management" />
            <NavItem href="/admin/privileges" label="Privileges" />
            <NavItem href="/admin/users/members" label="All Members" />
            <NavItem href="/admin/users/agents/1" label="Agent Detail" />
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
