import type { RefillStatus } from '@/lib/forecast';
import { supplyCells } from '@/lib/supply-cells';

const SEALED: Record<RefillStatus, string> = {
  ok: 'bg-foil',
  low: 'bg-low-fill',
  critical: 'bg-critical',
};

// One cell per day of supply, like a blister strip: sealed cells are days still
// covered, empty cells are days that aren't. Decorative: the text beside it
// says the same thing, so it's hidden from screen readers.
export default function SupplyStrip({
  daysLeft,
  status,
}: {
  daysLeft: number;
  status: RefillStatus;
}) {
  return (
    <div className="flex flex-wrap gap-1" aria-hidden="true">
      {supplyCells(daysLeft).map((sealed, i) => (
        <span
          key={i}
          className={`size-3.5 rounded-full border ${
            sealed ? `${SEALED[status]} border-ink/20` : 'border-dashed border-ink/25'
          }`}
        />
      ))}
    </div>
  );
}