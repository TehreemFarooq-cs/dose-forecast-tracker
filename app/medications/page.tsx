'use client';

import MedicationDashboard from '@/components/MedicationDashboard';
import { useMedications } from '@/lib/use-medications';

export default function MedicationsPage() {
  const { medications, hasLoaded, add, update, remove } = useMedications();

  return (
    <div className="h-full overflow-y-auto">
      <h1 className="sr-only">Medications</h1>
      <MedicationDashboard
        medications={medications}
        hasLoaded={hasLoaded}
        onAdd={add}
        onUpdate={update}
        onRemove={remove}
      />
    </div>
  );
}