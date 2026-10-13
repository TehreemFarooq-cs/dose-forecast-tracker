'use client';

import { useMemo, useState } from 'react';
import RefillForecastCard from './RefillForecastCard';
import MedicationForm from './MedicationForm';
import { calculateRefillForecast, type RefillForecast } from '@/lib/forecast';
import type { Medication, MedicationInput } from '@/lib/medications';

type Props = {
  medications: Medication[];
  hasLoaded: boolean;
  onAdd: (input: MedicationInput) => Promise<unknown>;
  onUpdate: (id: string, patch: Partial<MedicationInput>) => Promise<unknown>;
  onRemove: (id: string) => Promise<void>;
};

type Row = { med: Medication; forecast: RefillForecast | null };

// Soonest refill first; as-needed medications (no forecast) go last.
function buildRows(medications: Medication[]): Row[] {
  const rows: Row[] = medications.map((med) => ({
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

  return rows.sort((a, b) => {
    if (a.forecast && b.forecast) return a.forecast.daysRemaining - b.forecast.daysRemaining;
    if (a.forecast) return -1;
    if (b.forecast) return 1;
    return a.med.name.localeCompare(b.med.name);
  });
}

function dueText(days: number) {
  if (days === 0) return 'today';
  return `in ${days} ${days === 1 ? 'day' : 'days'}`;
}

export default function MedicationDashboard({
  medications,
  hasLoaded,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const rows = useMemo(() => buildRows(medications), [medications]);
  const soonest = rows.find((r) => r.forecast)?.forecast ?? null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-800">Your medications</h2>
        {hasLoaded && rows.length > 0 && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"
          >
            Add medication
          </button>
        )}
      </div>

      {soonest && (
        <p className="text-sm text-gray-600 mb-3">
          Next refill: <strong>{soonest.drugName}</strong> {dueText(soonest.daysRemaining)} (
          {soonest.refillByDate})
        </p>
      )}

      {adding && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
          <MedicationForm
            submitLabel="Add medication"
            onSubmit={async (input) => {
              await onAdd(input);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {!hasLoaded ? (
        <div role="status" aria-label="Loading medications" className="space-y-3">
          <div className="h-28 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-28 rounded-lg bg-gray-200 animate-pulse" />
        </div>
      ) : rows.length === 0 ? (
        !adding && (
          <div className="text-center py-10 px-4 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-2xl mb-2" aria-hidden="true">
              💊
            </p>
            <p className="font-medium text-gray-800 mb-1">No medications yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Add what you take and how many pills you have left, and this page will show when
              each one needs a refill.
            </p>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add your first medication
            </button>
          </div>
        )
      ) : (
        <ul>
          {rows.map(({ med, forecast }) => (
            <li key={med.id}>
              {editingId === med.id ? (
                <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                  <MedicationForm
                    initial={{
                      name: med.name,
                      pillsRemaining: med.pillsRemaining,
                      dosesPerDay: med.dosesPerDay,
                    }}
                    submitLabel="Save changes"
                    onSubmit={async (input) => {
                      await onUpdate(med.id, input);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="mb-3">
                  {forecast ? (
                    <RefillForecastCard result={forecast} />
                  ) : (
                    <div className="rounded-lg border-2 border-gray-300 bg-white p-4 my-2">
                      <h3 className="font-bold text-sm text-gray-800">{med.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        As-needed · {med.pillsRemaining} pills left
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 text-xs px-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(med.id)}
                      aria-label={`Edit ${med.name}`}
                      className="text-blue-700 hover:underline"
                    >
                      Edit
                    </button>
                    {deletingId === med.id ? (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await onRemove(med.id);
                            setDeletingId(null);
                          }}
                          aria-label={`Confirm delete ${med.name}`}
                          className="text-red-700 font-medium hover:underline"
                        >
                          Confirm delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="text-gray-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(med.id)}
                        aria-label={`Delete ${med.name}`}
                        className="text-gray-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}