import { localDateKey, type DoseLog } from './dose-log';

// Async on purpose, like the medication store: a Firestore version can implement
// this same interface later without any caller changing.
export interface DoseLogStore {
  list(): Promise<DoseLog[]>;
  add(medicationId: string, when?: Date): Promise<DoseLog>;
  // Removes the most recent log for this medication on the given day.
  // Returns the removed log, or null if there was nothing to remove.
  removeLatest(medicationId: string, dateKey: string): Promise<DoseLog | null>;
}

const KEY = 'dose-forecast-dose-logs';

function read(): DoseLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DoseLog[]) : [];
  } catch {
    return []; // corrupted data: start fresh instead of crashing
  }
}

function write(logs: DoseLog[]) {
  localStorage.setItem(KEY, JSON.stringify(logs));
}

export const localDoseLogStore: DoseLogStore = {
  async list() {
    return read();
  },

  async add(medicationId, when = new Date()) {
    const log: DoseLog = {
      id: crypto.randomUUID(),
      medicationId,
      date: localDateKey(when),
      takenAt: when.toISOString(),
    };
    write([...read(), log]);
    return log;
  },

  async removeLatest(medicationId, dateKey) {
    const logs = read();
    const matches = logs.filter((l) => l.medicationId === medicationId && l.date === dateKey);
    if (matches.length === 0) return null;

    const latest = matches.reduce((a, b) => (a.takenAt >= b.takenAt ? a : b));
    write(logs.filter((l) => l.id !== latest.id));
    return latest;
  },
};