import { describe, it, expect } from 'vitest';
import { countTakenOn, localDateKey, type DoseLog } from './dose-log';

describe('localDateKey', () => {
  it('uses the local calendar day, even late in the evening', () => {
    expect(localDateKey(new Date(2026, 9, 23, 23, 30))).toBe('2026-10-23');
  });

  it('pads single-digit months and days', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('countTakenOn', () => {
  const logs: DoseLog[] = [
    { id: '1', medicationId: 'a', date: '2026-10-23', takenAt: '2026-10-23T15:00:00.000Z' },
    { id: '2', medicationId: 'a', date: '2026-10-23', takenAt: '2026-10-23T23:00:00.000Z' },
    { id: '3', medicationId: 'b', date: '2026-10-23', takenAt: '2026-10-23T15:00:00.000Z' },
    { id: '4', medicationId: 'a', date: '2026-10-22', takenAt: '2026-10-22T15:00:00.000Z' },
  ];

  it('counts only the given medication on the given day', () => {
    expect(countTakenOn(logs, 'a', '2026-10-23')).toBe(2);
    expect(countTakenOn(logs, 'b', '2026-10-23')).toBe(1);
    expect(countTakenOn(logs, 'a', '2026-10-22')).toBe(1);
  });

  it('returns 0 when nothing was logged', () => {
    expect(countTakenOn(logs, 'c', '2026-10-23')).toBe(0);
  });
});