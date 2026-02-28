import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import './variant-mobile.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'BetArena - Sports Betting Platform',
  description: 'Professional sports betting platform with live odds and real-time updates',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
