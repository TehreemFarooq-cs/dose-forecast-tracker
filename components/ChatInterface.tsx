'use client';

import RefillForecastCard from './RefillForecastCard';
import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Streamdown } from 'streamdown';
import type { MyUIMessage } from '@/lib/chat-types';

const STORAGE_KEY = 'dose-forecast-chat';

export default function ChatInterface() {
  const { messages, sendMessage, status, stop, setMessages } = useChat<MyUIMessage>();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load saved conversation once, after mount (browser-only, avoids hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setMessages(JSON.parse(raw));
      }
    } catch {
      // corrupted data — ignore, start fresh
    }
    setHasLoaded(true);
  }, [setMessages]);

  // Persist whenever messages change — but only after the initial load has completed
  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, hasLoaded]);

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight < 48;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pinned = isNearBottom(el);
    isPinnedRef.current = pinned;
    setShowJumpToLatest(!pinned);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && isPinnedRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    isPinnedRef.current = true;
    setShowJumpToLatest(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== 'ready') return;
    sendMessage({ text: input });
    setInput('');
    isPinnedRef.current = true;
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 relative">
      <button
        onClick={clearConversation}
        className="text-xs text-gray-500 hover:text-gray-700 underline mb-2 self-start"
      >
        Clear conversation
      </button>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${
              m.role === 'user'
                ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                : 'bg-gray-200 text-gray-800 mr-auto max-w-[80%]'
            }`}
          >
            <p className="text-xs font-bold mb-1">{m.role === 'user' ? 'You' : 'AI'}</p>
            {m.parts.map((part, i) => {
  if (part.type === 'text') {
    return (
      <Streamdown key={i} isAnimating={status === 'streaming'} className="text-sm">
        {part.text}
      </Streamdown>
    );
  }

  if (part.type === 'tool-getRefillForecast') {
    switch (part.state) {
      case 'input-streaming':
        return (
          <div key={i} className="text-xs text-gray-500 italic my-2 animate-pulse">
            Reading dosage details…
          </div>
        );

      case 'input-available':
        return (
          <div key={i} className="text-xs text-gray-500 italic my-2 animate-pulse">
            Calculating refill forecast for {part.input?.drugName ?? '…'}…
          </div>
        );

      case 'output-available':
        return <RefillForecastCard key={i} result={part.output} />;

      case 'output-error':
        return (
          <div
            key={i}
            className="rounded-lg border-2 border-red-300 bg-red-50 p-3 my-2 text-sm text-red-800"
          >
            <p className="font-semibold mb-1">Couldn't calculate a forecast</p>
            <p>{part.errorText}</p>
          </div>
        );

      default:
        return null;
    }
  }

  return null;
})}
        </div>
        ))}

        {status === 'submitted' && (
          <div className="bg-gray-200 text-gray-800 p-3 rounded-lg mr-auto max-w-[80%] text-sm animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      {showJumpToLatest && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-md"
        >
          Jump to latest ↓
        </button>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          id="message-input"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your medication schedule or dose forecast..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        />
        {status === 'streaming' || status === 'submitted' ? (
          <button
            type="button"
            onClick={() => stop()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={status !== 'ready' || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}