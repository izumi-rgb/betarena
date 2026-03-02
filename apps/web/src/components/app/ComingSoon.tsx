'use client';

import Link from 'next/link';

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0E1A] px-4 text-white">
      <div className="w-full max-w-lg rounded-xl border border-[#1E293B] bg-[#111827] p-6 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[#94A3B8]">{description}</p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Link href="/sports" className="rounded-lg bg-[#00C37B] px-4 py-2 text-sm font-bold text-[#0B0E1A]">
            Back to Sports
          </Link>
          <Link href="/" className="rounded-lg border border-[#1E293B] px-4 py-2 text-sm font-bold text-white">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
