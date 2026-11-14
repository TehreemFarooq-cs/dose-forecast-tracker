import { useCallback, useEffect, useState } from 'react';
import { localDoseLogStore as logStore } from './dose-log-store';
import { localMedicationStore as medStore } from './medication-store';
import { localDateKey, type DoseLog } from './dose-log';

// `onStockChanged` lets the caller refresh its medication list after a dose
// changes the pill count.
export function useDoseLog(onStockChanged: () => Promise<void> | void) {
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setLogs(await logStore.list());
  }, []);

  useEffect(() => {
    refresh().then(() => setHasLoaded(true));
  }, [refresh]);

  // Taking a dose uses one pill. Returns the pills left, or null if out of stock.
  const takeDose = useCallback(
    async (medicationId: string): Promise<number | null> => {
      // Read the current stock from the store, not from React state, so a quick
      // double-click can't work from stale numbers.
      const current = (await medStore.list()).find((m) => m.id === medicationId);
      if (!current || current.pillsRemaining <= 0) return null;

      const pillsLeft = current.pillsRemaining - 1;
      await medStore.update(medicationId, { pillsRemaining: pillsLeft });
      await logStore.add(medicationId);
      await Promise.all([refresh(), onStockChanged()]);
      return pillsLeft;
    },
    [refresh, onStockChanged],
  );

  // Undo removes today's most recent log and gives the pill back.
  // Returns the pills left, or null if there was nothing to undo.
  const undoDose = useCallback(
    async (medicationId: string): Promise<number | null> => {
      const removed = await logStore.removeLatest(medicationId, localDateKey());
      if (!removed) return null;

      const current = (await medStore.list()).find((m) => m.id === medicationId);
      if (!current) return null;

      const pillsLeft = current.pillsRemaining + 1;
      await medStore.update(medicationId, { pillsRemaining: pillsLeft });
      await Promise.all([refresh(), onStockChanged()]);
      return pillsLeft;
    },
    [refresh, onStockChanged],
  );

  // Adds ready-made logs (sample history) without touching stock.
  const importLogs = useCallback(
    async (newLogs: DoseLog[]) => {
      await logStore.addMany(newLogs);
      await refresh();
    },
    [refresh],
  );

  return { logs, hasLoaded, takeDose, undoDose, importLogs };
}