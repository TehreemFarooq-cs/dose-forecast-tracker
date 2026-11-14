import { describe, it, expect } from 'vitest';
import { STRIP_DAYS, supplyCells } from './supply-cells';

const sealedCount = (cells: boolean[]) => cells.filter(Boolean).length;

describe('supplyCells', () => {
  it('always returns one cell per day on the strip', () => {
    for (const days of [0, 5, 45]) {
      expect(supplyCells(days)).toHaveLength(STRIP_DAYS);
    }
  });

  it('seals one cell per day of supply left, from the start of the strip', () => {
    const cells = supplyCells(5);
    expect(sealedCount(cells)).toBe(5);
    expect(cells.slice(0, 5).every(Boolean)).toBe(true);
  });

  it('shows a full strip when supply is longer than the strip', () => {
    expect(sealedCount(supplyCells(45))).toBe(STRIP_DAYS);
  });

  it('is empty when there is no supply', () => {
    expect(sealedCount(supplyCells(0))).toBe(0);
    expect(sealedCount(supplyCells(-3))).toBe(0);
  });
});