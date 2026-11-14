'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMedications } from '@/lib/use-medications';
import { useDoseLog } from '@/lib/use-dose-log';
import { countTakenOn, localDateKey } from '@/lib/dose-log';
import type { Medication } from '@/lib/medications';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function pills(n: number) {
  return `${n} ${n === 1 ? 'pill' : 'pills'}`;
}

export default function TodayChecklist() {
  const { medications, hasLoaded: medsLoaded, refresh } = useMedications();
  const { logs, hasLoaded: logsLoaded, takeDose, undoDose } = useDoseLog(refresh);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Anything that depends on the date waits for `loaded`, so the server-rendered
  // HTML and the first client render match (no hydration mismatch).
  const loaded = medsLoaded && logsLoaded;
  const todayKey = localDateKey();

  const rows = useMemo(
    () =>
      medications
        .map((med) => ({ med, taken: countTakenOn(logs, med.id, todayKey) }))
        .sort((a, b) => {
          const aScheduled = a.med.dosesPerDay > 0;
          const bScheduled = b.med.dosesPerDay > 0;
          if (aScheduled !== bScheduled) return aScheduled ? -1 : 1;
          return a.med.name.localeCompare(b.med.name);
        }),
    [medications, logs, todayKey],
  );

  const scheduled = rows.filter((r) => r.med.dosesPerDay > 0);
  const done = scheduled.filter((r) => r.taken >= r.med.dosesPerDay).length;

  const run = async (id: string, action: () => Promise<void>) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  const handleTake = (med: Medication) =>
    run(med.id, async () => {
      const left = await takeDose(med.id);
      setMessage(
        left === null ? `${med.name} is out of stock.` : `Logged ${med.name}. ${pills(left)} left.`,
      );
    });

  const handleUndo = (med: Medication) =>
    run(med.id, async () => {
      const left = await undoDose(med.id);
      setMessage(
        left === null
          ? `No ${med.name} dose to undo today.`
          : `Undid the last ${med.name} dose. ${pills(left)} left.`,
      );
    });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold text-gray-800">Today</h1>
        {loaded && (
          <p className="text-sm text-gray-500 mb-3">
            {dateFormatter.format(new Date())}
            {scheduled.length > 0 && ` · ${done} of ${scheduled.length} scheduled medications done`}
          </p>
        )}

        {/* Always rendered so screen readers announce changes to it. */}
        <p role="status" className="text-sm text-gray-700 min-h-5 mb-2">
          {message}
        </p>

        {!loaded ? (
          <div role="status" aria-label="Loading today's doses" className="space-y-3">
            <div className="h-24 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-24 rounded-lg bg-gray-200 animate-pulse" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="font-medium text-gray-800 mb-1">Nothing to log yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Add a medication first, then come back here each day to mark doses as taken.
            </p>
            <Link
              href="/medications"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add a medication
            </Link>
          </div>
        ) : (
          <ul>
            {rows.map(({ med, taken }) => {
              const isScheduled = med.dosesPerDay > 0;
              const complete = isScheduled && taken >= med.dosesPerDay;
              const outOfStock = med.pillsRemaining <= 0;
              const progress = isScheduled ? Math.min(100, (taken / med.dosesPerDay) * 100) : 0;

              return (
                <li key={med.id} className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-sm text-gray-800">{med.name}</h2>
                      <p className="text-xs text-gray-500">
                        {isScheduled
                          ? `${taken} of ${med.dosesPerDay} taken today`
                          : `As-needed · ${taken} taken today`}
                        {' · '}
                        {pills(med.pillsRemaining)} left
                      </p>
                    </div>
                    {complete && (
                      <span className="shrink-0 text-xs font-semibold text-green-800 bg-green-50 border border-green-300 rounded-full px-2 py-0.5">
                        Done
                      </span>
                    )}
                  </div>

                  {isScheduled && (
                    <div className="h-2 rounded-full bg-gray-200 mt-2" aria-hidden="true">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => handleTake(med)}
                      disabled={busyId !== null || outOfStock}
                      aria-label={`Mark ${med.name} taken`}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Mark taken
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUndo(med)}
                      disabled={busyId !== null || taken === 0}
                      aria-label={`Undo last ${med.name} dose`}
                      className="text-xs font-medium text-gray-700 hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      Undo
                    </button>
                    {outOfStock && (
                      <span className="text-xs text-red-700">
                        Out of stock.{' '}
                        <Link href="/medications" className="underline">
                          Update stock
                        </Link>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}