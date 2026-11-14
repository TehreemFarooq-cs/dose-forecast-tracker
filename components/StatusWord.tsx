import type { RefillStatus } from '@/lib/forecast';

const STATUS = {
  ok: { label: 'On track', text: 'text-ok', marker: 'bg-ok' },
  low: { label: 'Running low', text: 'text-low', marker: 'bg-low-fill' },
  critical: { label: 'Refill now', text: 'text-critical', marker: 'bg-critical' },
} as const;

// The status in words, with a small marker. Color supports the word, never replaces it.
export default function StatusWord({ status }: { status: RefillStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${s.text}`}>
      <span aria-hidden="true" className={`size-2 rounded-[1px] ${s.marker}`} />
      {s.label}
    </span>
  );
}