'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/today', label: 'Today' },
  { href: '/medications', label: 'Medications' },
  { href: '/assistant', label: 'Assistant' },
];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="h-dvh flex flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-[3px] focus:bg-panel focus:px-3 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to main content
      </a>

      {/* Desktop rail */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col border-r border-rule">
        <div className="px-5 pt-6 pb-8">
          <p className="font-display text-2xl font-bold leading-none">Dose Forecast</p>
        </div>
        <nav aria-label="Main">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`block border-l-[3px] py-2 pl-4 pr-3 ${
                isActive(href)
                  ? 'border-ink font-bold text-ink'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto p-5 text-xs text-ink-soft">
          For tracking only. Not a substitute for medical advice.
        </p>
      </aside>

      {/* Mobile title bar */}
      <div className="md:hidden border-b border-rule px-5 py-3">
        <p className="font-display text-xl font-bold leading-none">Dose Forecast</p>
      </div>

      <main id="main" tabIndex={-1} className="flex-1 min-h-0 min-w-0 focus:outline-none">
        {children}
      </main>

      {/* Mobile tabs */}
      <nav aria-label="Main" className="md:hidden grid grid-cols-4 border-t border-rule">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`border-t-[3px] py-3 text-center text-sm ${
              isActive(href)
                ? 'border-ink font-bold text-ink'
                : 'border-transparent text-ink-soft'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}