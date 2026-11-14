import './globals.css';
import type { Metadata } from 'next';
import { Atkinson_Hyperlegible, Barlow_Condensed } from 'next/font/google';
import AppFrame from '@/components/AppFrame';

const body = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--next-font-body',
  display: 'swap',
});

const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--next-font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dose Forecast Tracker',
  description: 'Medication inventory adherence forecasting application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="h-dvh bg-paper text-ink font-sans antialiased">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}