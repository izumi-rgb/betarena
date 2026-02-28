'use client';

import React from 'react';
import { MemberGlobalChrome } from '@/components/app/MemberGlobalChrome';
import { SocketBootstrap } from '@/components/app/SocketBootstrap';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SocketBootstrap />
      <div className="md:pr-[320px]">{children}</div>
      <MemberGlobalChrome />
    </>
  );
}
