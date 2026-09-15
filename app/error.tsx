'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-4 p-6 text-center bg-gray-50">
      <h2 className="text-lg font-bold text-gray-800">Something went wrong</h2>
      <p className="text-sm text-gray-600 max-w-sm">
        The Dose Forecast Assistant ran into an unexpected problem. Your conversation
        history is safe - try reloading to pick back up.
      </p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}