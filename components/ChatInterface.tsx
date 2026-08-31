'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function ChatInterface() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== 'ready') return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m) => {
          const textContent = m.parts
            ? m.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text').map((p) => p.text).join('')
            : '';

          return (
            <div
              key={m.id}
              className={`p-3 rounded-lg ${
                m.role === 'user' ? 'bg-blue-600 text-white ml-auto max-w-[80%]' : 'bg-gray-200 text-gray-800 mr-auto max-w-[80%]'
              }`}
            >
              <p className="text-xs font-bold mb-1">{m.role === 'user' ? 'You' : 'AI'}</p>
              <p className="whitespace-pre-wrap text-sm">{textContent}</p>
            </div>
          );
        })}
        {status === 'submitted' && (
          <div className="bg-gray-200 text-gray-800 p-3 rounded-lg mr-auto max-w-[80%] text-sm animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your medication schedule or dose forecast..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        />
        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}