'use client';

import React from 'react';
import { MemberGlobalChrome } from '@/components/app/MemberGlobalChrome';
import { SocketBootstrap } from '@/components/app/SocketBootstrap';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SocketBootstrap />
      <ErrorBoundary>
        <div className="md:pr-[320px]">{children}</div>
      </ErrorBoundary>
      <MemberGlobalChrome />
    </>
  );
}
