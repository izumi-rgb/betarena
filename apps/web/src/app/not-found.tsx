'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E1A] p-6 text-white">
      <div className="text-center">
        <div className="text-[120px] font-black leading-none text-[#00C37B]">404</div>
        <h1 className="mt-2 text-3xl font-bold">Page Not Found</h1>
        <p className="mx-auto mt-3 max-w-lg text-[#94A3B8]">The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg border border-[#00C37B] px-4 py-2 text-[#00C37B]">← Go Back</button>
          <Link href="/sports" className="rounded-lg bg-[#00C37B] px-4 py-2 font-semibold text-[#0B0E1A]">Go to Sports Lobby</Link>
        </div>
      </div>
    </div>
  );
}
