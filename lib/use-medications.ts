import { useCallback, useEffect, useState } from 'react';
import { localMedicationStore as store } from './medication-store';
import type { Medication, MedicationInput } from './medications';

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setMedications(await store.list());
  }, []);

  // Load after mount (not during render) to avoid a server/client hydration mismatch.
  useEffect(() => {
    refresh().then(() => setHasLoaded(true));
  }, [refresh]);

  const add = useCallback(
    async (input: MedicationInput) => {
      const med = await store.add(input);
      await refresh();
      return med;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, patch: Partial<MedicationInput>) => {
      const med = await store.update(id, patch);
      await refresh();
      return med;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await store.remove(id);
      await refresh();
    },
    [refresh],
  );

  return { medications, hasLoaded, add, update, remove };
}