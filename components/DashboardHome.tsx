'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import StatusWord from './StatusWord';
import SupplyStrip from './SupplyStrip';
import { useMedications } from '@/lib/use-medications';
import { useDoseLog } from '@/lib/use-dose-log';
import { calculateRefillForecast, type RefillForecast } from '@/lib/forecast';
import { weeklyAdherence } from '@/lib/adherence';
import { buildSampleLogs, sampleCreatedAt, sampleMedications } from '@/lib/sample-data';
import type { Medication } from '@/lib/medications';

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

type Row = { med: Medication; forecast: RefillForecast | null };

function dayCount(n: number) {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

function pillCount(n: number) {
  return `${n} ${n === 1 ? 'pill' : 'pills'}`;
}

function adherenceTint(percent: number | null) {
  if (percent === null) return 'bg-panel';
  if (percent >= 80) return 'bg-ok-tint';
  if (percent >= 50) return 'bg-low-tint';
  return 'bg-critical-tint';
}

export default function DashboardHome() {
  const { medications, hasLoaded: medsLoaded, add, refresh } = useMedications();
  const { logs, hasLoaded: logsLoaded, importLogs } = useDoseLog(refresh);
  const [seeding, setSeeding] = useState(false);

  // Anything date-dependent renders only after loading, so the server-rendered
  // HTML and the first client render match.
  const hasLoaded = medsLoaded && logsLoaded;

  // Soonest to run out first; as-needed medications (no forecast) go last.
  const rows: Row[] = useMemo(() => {
    const built = medications.map((med) => ({
      med,
      forecast:
        med.dosesPerDay === 0
          ? null
          : calculateRefillForecast({
              drugName: med.name,
              pillsRemaining: med.pillsRemaining,
              dosesPerDay: med.dosesPerDay,
            }),
    }));
    return built.sort((a, b) => {
      if (a.forecast && b.forecast) return a.forecast.daysRemaining - b.forecast.daysRemaining;
      if (a.forecast) return -1;
      if (b.forecast) return 1;
      return a.med.name.localeCompare(b.med.name);
    });
  }, [medications]);

  const adherence = useMemo(() => weeklyAdherence(medications, logs), [medications, logs]);

  const soonest = rows.find((r) => r.forecast)?.forecast ?? null;
  const dueSoon = rows.filter((r) => r.forecast && r.forecast.status !== 'ok').length;
  const hasScheduled = rows.some((r) => r.forecast);

  let headline: string;
  let detail: string;
  if (!soonest) {
    headline = 'Nothing to forecast yet.';
    detail = "As-needed medications don't have a refill date.";
  } else if (soonest.status === 'ok') {
    headline = 'Everything is on track.';
    detail = `Next refill: ${soonest.drugName} in ${dayCount(soonest.daysRemaining)}, by ${soonest.refillByDate}.`;
  } else {
    headline =
      soonest.daysRemaining === 0
        ? `${soonest.drugName} needs a refill today.`
        : `${soonest.drugName} runs out first.`;
    detail = `${dayCount(soonest.daysRemaining)} left, refill by ${soonest.refillByDate}.`;
  }

  const summary = `${medications.length} ${
    medications.length === 1 ? 'medication' : 'medications'
  } tracked. ${dueSoon === 0 ? 'None' : dueSoon} due for a refill within a week.`;

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
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-8">
        <h1 className="font-display text-xl font-semibold text-ink-soft">Dashboard</h1>

        {!hasLoaded ? (
          <div role="status" aria-label="Loading dashboard" className="space-y-4">
            <div className="h-12 w-3/4 rounded-[3px] bg-rule motion-safe:animate-pulse" />
            <div className="h-40 rounded-[3px] bg-rule motion-safe:animate-pulse" />
          </div>
        ) : medications.length === 0 ? (
          <section>
            <p className="font-display text-4xl font-bold leading-tight">Nothing tracked yet.</p>
            <p className="mt-2 text-ink-soft max-w-md">
              Add a medication and its pill count to see when it needs a refill. Or load sample
              data, with a week of dose history, to look around first.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/medications"
                className="bg-ink text-paper px-4 py-2 rounded-[3px] font-bold hover:bg-ink/90"
              >
                Add a medication
              </Link>
              <button
                type="button"
                onClick={loadSamples}
                disabled={seeding}
                className="border border-ink px-4 py-2 rounded-[3px] font-bold hover:bg-panel disabled:opacity-50"
              >
                {seeding ? 'Loading…' : 'Load sample data'}
              </button>
            </div>
          </section>
        ) : (
          <>
            <section aria-label="Summary">
              <p className="font-display text-4xl font-bold leading-tight">{headline}</p>
              <p className="mt-2">{detail}</p>
              <p className="mt-1 text-ink-soft">{summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  href="/today"
                  className="bg-ink text-paper px-4 py-2 rounded-[3px] font-bold hover:bg-ink/90"
                >
                  Log today's doses
                </Link>
                <Link href="/medications" className="underline underline-offset-4">
                  Manage medications
                </Link>
                <Link href="/assistant" className="underline underline-offset-4">
                  Ask the assistant
                </Link>
              </div>
            </section>

            <section aria-labelledby="supply-heading">
              <h2 id="supply-heading" className="font-display text-2xl font-semibold mb-2">
                Supply
              </h2>
              <ul className="bg-panel border border-rule rounded-sm px-4 divide-y divide-dashed divide-rule">
                {rows.map(({ med, forecast }) => (
                  <li key={med.id} className="py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-2xl font-semibold leading-tight">
                        {med.name}
                      </h3>
                      {forecast ? (
                        <StatusWord status={forecast.status} />
                      ) : (
                        <span className="text-sm text-ink-soft">As needed</span>
                      )}
                    </div>
                    {forecast && (
                      <div className="my-2">
                        <SupplyStrip daysLeft={forecast.daysRemaining} status={forecast.status} />
                      </div>
                    )}
                    <p className="text-sm text-ink-soft">
                      {forecast
                        ? `${dayCount(forecast.daysRemaining)} left, refill by ${forecast.refillByDate}. ${pillCount(med.pillsRemaining)} at ${med.dosesPerDay} a day.`
                        : `${pillCount(med.pillsRemaining)} left. No fixed schedule, so no refill date.`}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {hasScheduled && (
              <section aria-labelledby="adherence-heading">
                <h2 id="adherence-heading" className="font-display text-2xl font-semibold mb-2">
                  Adherence
                </h2>
                {adherence.percent === null ? (
                  <p className="text-sm text-ink-soft max-w-md">
                    No history yet. Mark doses as taken on the{' '}
                    <Link href="/today" className="underline underline-offset-4 text-ink">
                      Today page
                    </Link>{' '}
                    and your week will fill in here.
                  </p>
                ) : (
                  <>
                    <p className="mb-3">
                      {adherence.percent}% of scheduled doses taken over the last 7 days.
                    </p>
                    <ol className="grid grid-cols-7 gap-1">
                      {adherence.days.map((day) => (
                        <li
                          key={day.date}
                          className={`rounded-[3px] border border-rule px-1 py-2 text-center ${adherenceTint(day.percent)}`}
                        >
                          <span className="block text-xs text-ink-soft">
                            {weekdayFormatter.format(new Date(`${day.date}T12:00:00`))}
                          </span>
                          <span className="block font-display text-xl font-semibold">
                            {day.percent === null ? '–' : `${day.percent}%`}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-2 text-xs text-ink-soft">
                      Completed days only. Extra doses don't make up for missed ones.
                    </p>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}