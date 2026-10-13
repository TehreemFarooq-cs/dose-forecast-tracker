import { describe, it, expect } from 'vitest';
import { calculateRefillForecast } from './forecast';

const today = new Date('2026-10-13T12:00:00Z');

describe('calculateRefillForecast', () => {
  it('computes days remaining and the refill date from a fixed date', () => {
    const result = calculateRefillForecast(
      { drugName: 'Drug A', pillsRemaining: 20, dosesPerDay: 2 },
      today,
    );
    expect(result.daysRemaining).toBe(10);
    expect(result.refillByDate).toBe('2026-10-23');
    expect(result.status).toBe('ok');
  });

  it('rounds partial days down', () => {
    const result = calculateRefillForecast(
      { drugName: 'Drug A', pillsRemaining: 7, dosesPerDay: 2 },
      today,
    );
    expect(result.daysRemaining).toBe(3);
    expect(result.status).toBe('low');
  });

  it('throws for as-needed medications', () => {
    expect(() =>
      calculateRefillForecast({ drugName: 'Drug A', pillsRemaining: 10, dosesPerDay: 0 }, today),
    ).toThrow(/as-needed/i);
  });
});