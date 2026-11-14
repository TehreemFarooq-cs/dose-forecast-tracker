import type { RefillForecast } from '@/lib/forecast';
import StatusWord from './StatusWord';
import SupplyStrip from './SupplyStrip';

export default function RefillForecastCard({ result }: { result: RefillForecast }) {
  const daysText = `${result.daysRemaining} ${result.daysRemaining === 1 ? 'day' : 'days'}`;

  return (
    <div className="border border-rule bg-panel rounded-sm p-3 my-2 text-ink">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h3 className="font-display text-xl font-semibold leading-tight">{result.drugName}</h3>
        <StatusWord status={result.status} />
      </div>

      <SupplyStrip daysLeft={result.daysRemaining} status={result.status} />

      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
        <div>
          <p className="text-xs text-ink-soft">Days remaining</p>
          <p className="font-bold">{daysText}</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">Refill by</p>
          <p className="font-bold">{result.refillByDate}</p>
        </div>
      </div>

      <p className="text-xs text-ink-soft mt-2">
        {result.pillsRemaining} pills left, {result.dosesPerDay} a day
      </p>
    </div>
  );
}