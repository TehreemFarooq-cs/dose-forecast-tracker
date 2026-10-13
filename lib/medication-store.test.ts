import { describe, it, expect, beforeEach } from 'vitest';
import { localMedicationStore as store } from './medication-store';

beforeEach(() => {
  localStorage.clear();
});

describe('localMedicationStore', () => {
  it('adds and lists a medication', async () => {
    const med = await store.add({ name: 'Drug A', pillsRemaining: 30, dosesPerDay: 2 });
    const all = await store.list();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(med.id);
  });

  it('updates stock and persists it', async () => {
    const med = await store.add({ name: 'Drug A', pillsRemaining: 30, dosesPerDay: 2 });
    await store.update(med.id, { pillsRemaining: 28 });
    expect((await store.list())[0].pillsRemaining).toBe(28);
  });

  it('removes a medication', async () => {
    const med = await store.add({ name: 'Drug A', pillsRemaining: 30, dosesPerDay: 2 });
    await store.remove(med.id);
    expect(await store.list()).toHaveLength(0);
  });

  it('rejects invalid input', async () => {
    await expect(
      store.add({ name: '', pillsRemaining: -1, dosesPerDay: 2 }),
    ).rejects.toThrow();
  });
});