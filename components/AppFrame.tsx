'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/medications', label: 'Medications' },
  { href: '/assistant', label: 'Assistant' },
];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="h-dvh flex flex-col md:flex-row bg-gray-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-blue-700"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col border-r bg-white">
        <div className="p-4 border-b">
          <p className="font-bold text-gray-800">💊 Dose Forecast Tracker</p>
        </div>
        <nav aria-label="Main" className="p-2 space-y-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(href) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto p-4 text-xs text-gray-500">
          For tracking only. Not a substitute for medical advice.
        </p>
      </aside>

      {/* Mobile title bar */}
      <div className="md:hidden border-b bg-white px-4 py-3">
        <p className="font-bold text-gray-800">💊 Dose Forecast Tracker</p>
      </div>

      <main id="main" tabIndex={-1} className="flex-1 min-h-0 min-w-0 focus:outline-none">
        {children}
      </main>

      {/* Mobile bottom tabs */}
      <nav aria-label="Main" className="md:hidden flex border-t bg-white">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`flex-1 border-t-2 py-3 text-center text-xs font-medium ${
              isActive(href)
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-600'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}