import type React from 'react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 pb-20">{children}</main>
      <SiteFooter />
    </>
  );
}
