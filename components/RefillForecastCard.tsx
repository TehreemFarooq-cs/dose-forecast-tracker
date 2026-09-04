type RefillForecastResult = {
  drugName: string;
  pillsRemaining: number;
  dosesPerDay: number;
  daysRemaining: number;
  refillByDate: string;
  status: 'ok' | 'low' | 'critical';
};

const STATUS_STYLES = {
  ok: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', label: 'On track' },
  low: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', label: 'Running low' },
  critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', label: 'Refill now' },
} as const;

export default function RefillForecastCard({ result }: { result: RefillForecastResult }) {
  const s = STATUS_STYLES[result.status];

  return (
    <div className={`rounded-lg border-2 ${s.border} ${s.bg} p-4 my-2`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-gray-800">{result.drugName}</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.text} bg-white`}>
          {s.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
        <div>
          <p className="text-xs text-gray-500">Days remaining</p>
          <p className="font-semibold">{result.daysRemaining} days</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Refill by</p>
          <p className="font-semibold">{result.refillByDate}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {result.pillsRemaining} pills left · {result.dosesPerDay}/day
      </p>
    </div>
  );
}