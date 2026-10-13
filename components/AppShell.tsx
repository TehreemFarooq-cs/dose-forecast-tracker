'use client';

import { useState } from 'react';
import ChatInterface from './ChatInterface';
import MedicationDashboard from './MedicationDashboard';
import { useMedications } from '@/lib/use-medications';

type Panel = 'medications' | 'assistant';

const PANELS: { id: Panel; label: string }[] = [
  { id: 'medications', label: 'Medications' },
  { id: 'assistant', label: 'Assistant' },
];

export default function AppShell() {
  const { medications, hasLoaded, add, update, remove } = useMedications();
  const [panel, setPanel] = useState<Panel>('medications');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Mobile-only switcher. Both panels stay mounted so the chat keeps its state. */}
      <div role="group" aria-label="Switch view" className="lg:hidden flex gap-2 p-2 border-b bg-white">
        {PANELS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanel(id)}
            aria-pressed={panel === id}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
              panel === id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:gap-4">
        <section
          aria-label="Medications"
          className={`${panel === 'medications' ? 'block' : 'hidden'} lg:block h-full min-h-0 overflow-y-auto`}
        >
          <MedicationDashboard
            medications={medications}
            hasLoaded={hasLoaded}
            onAdd={add}
            onUpdate={update}
            onRemove={remove}
          />
        </section>
        <section
          aria-label="Assistant"
          className={`${panel === 'assistant' ? 'block' : 'hidden'} lg:block h-full min-h-0`}
        >
          <ChatInterface />
        </section>
      </div>
    </div>
  );
}