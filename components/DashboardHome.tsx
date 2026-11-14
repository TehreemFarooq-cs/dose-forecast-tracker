'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import RefillForecastCard from './RefillForecastCard';
import { useMedications } from '@/lib/use-medications';
import { useDoseLog } from '@/lib/use-dose-log';
import { calculateRefillForecast, type RefillForecast } from '@/lib/forecast';
import { weeklyAdherence } from '@/lib/adherence';
import { buildSampleLogs, sampleCreatedAt, sampleMedications } from '@/lib/sample-data';
import type { Medication } from '@/lib/medications';

const BAR_COLOR = {
  ok: 'bg-green-500',
  low: 'bg-yellow-500',
  critical: 'bg-red-500',
} as const;
const MAX_BAR_DAYS = 30;

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

type Entry = { id: string; forecast: RefillForecast };

function adherenceColor(percent: number) {
  if (percent >= 80) return 'bg-green-500';
  if (percent >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-lg font-semibold text-gray-800">{children}</dd>
    </div>
  );
}

export default function DashboardHome() {
  const { medications, hasLoaded: medsLoaded, add, refresh } = useMedications();
  const { logs, hasLoaded: logsLoaded, importLogs } = useDoseLog(refresh);
  const [seeding, setSeeding] = useState(false);

  // Anything date-dependent renders only after loading, so the server-rendered
  // HTML and the first client render match.
  const hasLoaded = medsLoaded && logsLoaded;

  const entries: Entry[] = useMemo(
    () =>
      medications
        .filter((m) => m.dosesPerDay > 0)
        .map((m) => ({
          id: m.id,
          forecast: calculateRefillForecast({
            drugName: m.name,
            pillsRemaining: m.pillsRemaining,
            dosesPerDay: m.dosesPerDay,
          }),
        }))
        .sort((a, b) => a.forecast.daysRemaining - b.forecast.daysRemaining),
    [medications],
  );

  const adherence = useMemo(() => weeklyAdherence(medications, logs), [medications, logs]);

  const needAttention = entries.filter((e) => e.forecast.status !== 'ok');
  const next = entries[0]?.forecast ?? null;
  const hasScheduled = entries.length > 0;

  const loadSamples = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const createdAt = sampleCreatedAt();
      const added: Medication[] = [];
      for (const sample of sampleMedications) {
        added.push(await add(sample, { createdAt }));
      }
      await importLogs(buildSampleLogs(added));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>

        {!hasLoaded ? (
          <div role="status" aria-label="Loading dashboard" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-16 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-16 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-16 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-16 rounded-lg bg-gray-200 animate-pulse" />
            </div>
            <div className="h-28 rounded-lg bg-gray-200 animate-pulse" />
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-2xl mb-2" aria-hidden="true">
              💊
            </p>
            <h2 className="font-medium text-gray-800 mb-1">Welcome to Dose Forecast Tracker</h2>
            <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
              Track how many pills you have left and see when each medication needs a refill. Add
              your own, or load sample data (with a week of dose history) to look around first.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/medications"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Add a medication
              </Link>
              <button
                type="button"
                onClick={loadSamples}
                disabled={seeding}
                className="border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {seeding ? 'Loading…' : 'Load sample data'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Medications tracked">{medications.length}</Stat>
              <Stat label="Need a refill soon">{needAttention.length}</Stat>
              <Stat label="Next refill">
                {next ? (
                  <>
                    {next.drugName}
                    <span className="block text-xs font-normal text-gray-500">
                      {next.refillByDate}
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </Stat>
              <Stat label="7-day adherence">
                {adherence.percent === null ? (
                  <>
                    —
                    <span className="block text-xs font-normal text-gray-500">
                      Not enough history yet
                    </span>
                  </>
                ) : (
                  `${adherence.percent}%`
                )}
              </Stat>
            </dl>

            <section aria-labelledby="attention-heading">
              <h2 id="attention-heading" className="text-base font-semibold text-gray-800 mb-2">
                Needs attention
              </h2>
              {needAttention.length === 0 ? (
                <p className="text-sm text-green-800 bg-green-50 border border-green-300 rounded-lg p-3">
                  Everything is on track. No refills are needed in the next week.
                </p>
              ) : (
                <ul>
                  {needAttention.slice(0, 3).map(({ id, forecast }) => (
                    <li key={id}>
                      <RefillForecastCard result={forecast} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {hasScheduled && (
              <section aria-labelledby="supply-heading">
                <h2 id="supply-heading" className="text-base font-semibold text-gray-800 mb-2">
                  Days of supply left
                </h2>
                <ul className="space-y-3 bg-white border border-gray-200 rounded-lg p-4">
                  {entries.map(({ id, forecast }) => (
                    <li key={id}>
                      <div className="flex justify-between text-sm text-gray-700 mb-1">
                        <span>{forecast.drugName}</span>
                        <span>
                          {forecast.daysRemaining} {forecast.daysRemaining === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200" aria-hidden="true">
                        <div
                          className={`h-2 rounded-full ${BAR_COLOR[forecast.status]}`}
                          style={{
                            width: `${Math.max(
                              4,
                              (Math.min(forecast.daysRemaining, MAX_BAR_DAYS) / MAX_BAR_DAYS) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hasScheduled && (
              <section aria-labelledby="adherence-heading">
                <h2 id="adherence-heading" className="text-base font-semibold text-gray-800 mb-2">
                  Adherence, last 7 days
                </h2>
                {adherence.percent === null ? (
                  <p className="text-sm text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg p-4">
                    No history yet. Mark doses as taken on the{' '}
                    <Link href="/today" className="text-blue-700 underline">
                      Today page
                    </Link>{' '}
                    and your adherence will show up here.
                  </p>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <ul className="flex gap-2 h-40">
                      {adherence.days.map((day) => (
                        <li
                          key={day.date}
                          className="flex-1 flex flex-col items-center h-full min-w-0"
                        >
                          <span className="text-xs text-gray-700 h-4">
                            {day.percent === null ? '–' : `${day.percent}%`}
                          </span>
                          <div className="flex-1 w-full flex items-end" aria-hidden="true">
                            {day.percent !== null && (
                              <div
                                className={`w-full rounded-t ${adherenceColor(day.percent)}`}
                                style={{ height: `${Math.max(day.percent, 4)}%` }}
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 h-4 mt-1">
                            {weekdayFormatter.format(new Date(`${day.date}T12:00:00`))}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">
                      Counts completed days only. Extra doses don't make up for missed ones.
                    </p>
                  </div>
                )}
              </section>
            )}

            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/today" className="text-blue-700 hover:underline">
                Log today's doses →
              </Link>
              <Link href="/medications" className="text-blue-700 hover:underline">
                Manage medications →
              </Link>
              <Link href="/assistant" className="text-blue-700 hover:underline">
                Ask the assistant →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}