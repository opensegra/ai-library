import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppProviders } from '@/components/site/AppProviders';

import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'AI Library', template: '%s · AI Library' },
  description: 'Pose and costume references with a rigged 3D mannequin for every pose.'
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
