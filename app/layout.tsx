import type { Metadata } from 'next';

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
      <body className="h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}