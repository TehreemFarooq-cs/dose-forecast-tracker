export const STRIP_DAYS = 30;

// One entry per cell on the strip: true = sealed (a day of supply still left),
// false = empty. A supply longer than the strip shows a full strip.
export function supplyCells(daysLeft: number): boolean[] {
  const sealed = Math.max(0, Math.min(Math.floor(daysLeft), STRIP_DAYS));
  return Array.from({ length: STRIP_DAYS }, (_, i) => i < sealed);
}