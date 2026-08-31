import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-gray-50">
      <header className="p-4 border-b bg-white shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">Dose Forecast Assistant</h1>
      </header>
      <div className="flex-1 overflow-hidden p-4">
        <ChatInterface />
      </div>
    </main>
  );
}