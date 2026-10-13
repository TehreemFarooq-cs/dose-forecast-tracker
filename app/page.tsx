import AppShell from '@/components/AppShell';

export default function Home() {
  return (
    <main className="flex flex-col h-dvh bg-gray-50">
      <header className="p-4 border-b bg-white shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">Dose Forecast Tracker</h1>
      </header>
      <AppShell />
    </main>
  );
}