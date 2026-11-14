import { describe, it, expect, beforeEach } from 'vitest';
import { localDoseLogStore as store } from './dose-log-store';

beforeEach(() => {
  localStorage.clear();
});

describe('localDoseLogStore', () => {
  it('logs a dose against the local calendar day', async () => {
    const when = new Date(2026, 9, 23, 22, 15);
    const log = await store.add('med-1', when);

    expect(log.date).toBe('2026-10-23');
    expect(log.takenAt).toBe(when.toISOString());
    expect(await store.list()).toHaveLength(1);
  });

  it('adds many logs at once without losing existing ones', async () => {
    await store.add('med-1', new Date(2026, 9, 23, 8));
    await store.addMany([
      { id: 'x1', medicationId: 'med-2', date: '2026-10-22', takenAt: new Date(2026, 9, 22, 8).toISOString() },
      { id: 'x2', medicationId: 'med-2', date: '2026-10-21', takenAt: new Date(2026, 9, 21, 8).toISOString() },
    ]);

    expect(await store.list()).toHaveLength(3);
  });

  it('removes only the most recent log for that medication and day', async () => {
    const morning = new Date(2026, 9, 23, 8, 0);
    const evening = new Date(2026, 9, 23, 20, 0);
    await store.add('med-1', morning);
    await store.add('med-1', evening);
    await store.add('med-2', evening);

    const removed = await store.removeLatest('med-1', '2026-10-23');

    expect(removed?.takenAt).toBe(evening.toISOString());
    const remaining = await store.list();
    expect(remaining).toHaveLength(2);
    expect(
      remaining.some((l) => l.medicationId === 'med-1' && l.takenAt === morning.toISOString()),
    ).toBe(true);
    expect(remaining.some((l) => l.medicationId === 'med-2')).toBe(true);
  });

  it('returns null when there is nothing to remove', async () => {
    expect(await store.removeLatest('med-1', '2026-10-23')).toBeNull();
  });
});