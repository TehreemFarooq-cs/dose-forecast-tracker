export type DoseLog = {
  id: string;
  medicationId: string;
  date: string; // local calendar day, YYYY-MM-DD
  takenAt: string; // ISO timestamp
};

// Local calendar day (not UTC), so "today" matches the user's own clock.
export function localDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function countTakenOn(logs: DoseLog[], medicationId: string, dateKey: string): number {
  return logs.filter((l) => l.medicationId === medicationId && l.date === dateKey).length;
}