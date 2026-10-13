import './globals.css';
import type { Metadata } from 'next';
import AppFrame from '@/components/AppFrame';

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
    <html lang="en">
      <body className="h-dvh bg-gray-50 antialiased">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}