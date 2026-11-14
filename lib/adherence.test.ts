import { describe, it, expect } from 'vitest';
import { weeklyAdherence, addDays } from './adherence';
import { localDateKey, type DoseLog } from './dose-log';
import type { Medication } from './medications';

const today = new Date(2026, 10, 14, 12, 0); // Nov 14, 2026, local time

function med(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'a',
    name: 'Drug A',
    pillsRemaining: 10,
    dosesPerDay: 2,
    createdAt: new Date(2026, 10, 1).toISOString(),
    ...overrides,
  };
}

// `count` doses for one medication, `offset` days before today.
function logsFor(medicationId: string, offset: number, count: number): DoseLog[] {
  const day = addDays(today, -offset);
  return Array.from({ length: count }, (_, i) => ({
    id: `${medicationId}-${offset}-${i}`,
    medicationId,
    date: localDateKey(day),
    takenAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8 + i).toISOString(),
  }));
}

describe('weeklyAdherence', () => {
  it('is 100% when every scheduled dose was taken', () => {
    const logs = [7, 6, 5, 4, 3, 2, 1].flatMap((o) => logsFor('a', o, 2));
    const result = weeklyAdherence([med()], logs, today);

    expect(result.percent).toBe(100);
    expect(result.days).toHaveLength(7);
  });

  it('counts missed doses', () => {
    // Logged on 5 of the 7 days (the earliest day included), missed the last 2.
    const logs = [7, 6, 5, 4, 3].flatMap((o) => logsFor('a', o, 2));
    const result = weeklyAdherence([med()], logs, today);

    expect(result.percent).toBe(71); // 10 of 14
  });

  it("doesn't let extra doses make up for missed ones", () => {
    const logs = [...logsFor('a', 2, 1), ...logsFor('a', 1, 3)];
    const result = weeklyAdherence([med()], logs, today, 2);

    expect(result.percent).toBe(75); // (1 + 2) of 4, the 3rd dose on day 1 is capped
  });

  it("excludes today, so it can't count against you", () => {
    const logs = logsFor('a', 0, 2);
    const result = weeklyAdherence([med()], logs, today);

    expect(result.days.some((d) => d.date === localDateKey(today))).toBe(false);
    expect(result.percent).toBeNull();
  });

  it('only counts days from when tracking started', () => {
    const logs = [3, 2, 1].flatMap((o) => logsFor('a', o, 2));
    const result = weeklyAdherence([med()], logs, today);

    expect(result.percent).toBe(100);
    expect(result.days.filter((d) => d.expected > 0)).toHaveLength(3);
  });

  it('only counts a medication from the day it was added', () => {
    const added = med({ createdAt: new Date(2026, 10, 13, 9).toISOString() });
    const logs = logsFor('a', 1, 1);
    const result = weeklyAdherence([added], logs, today);

    expect(result.days.filter((d) => d.expected > 0)).toHaveLength(1);
    expect(result.percent).toBe(50); // 1 of 2 yesterday
  });

  it('is null (not 0%) when nothing has ever been logged', () => {
    expect(weeklyAdherence([med()], [], today).percent).toBeNull();
  });

  it('ignores as-needed medications', () => {
    const asNeeded = med({ dosesPerDay: 0 });
    const logs = logsFor('a', 1, 2);
    const result = weeklyAdherence([asNeeded], logs, today);

    expect(result.percent).toBeNull();
    expect(result.days.every((d) => d.expected === 0)).toBe(true);
  });

  it('combines several medications', () => {
    const a = med({ id: 'a', dosesPerDay: 2 });
    const b = med({ id: 'b', dosesPerDay: 1 });
    const logs = [7, 6, 5, 4, 3, 2, 1].flatMap((o) => logsFor('a', o, 2)); // nothing for b
    const result = weeklyAdherence([a, b], logs, today);

    expect(result.percent).toBe(67); // 2 of 3 doses each day
  });
});