import { addDays } from './adherence';
import { localDateKey, type DoseLog } from './dose-log';
import type { Medication, MedicationInput } from './medications';

// One of each status so the dashboard shows its full range.
export const sampleMedications: MedicationInput[] = [
  { name: 'Amoxicillin', pillsRemaining: 3, dosesPerDay: 3 }, // 1 day  → critical
  { name: 'Vitamin D', pillsRemaining: 5, dosesPerDay: 1 }, //   5 days → low
  { name: 'Metformin', pillsRemaining: 60, dosesPerDay: 2 }, //  30 days → ok
  { name: 'Ibuprofen', pillsRemaining: 12, dosesPerDay: 0 }, //  as-needed
];

export const SAMPLE_HISTORY_DAYS = 7;

// The sample medications are "added" this many days ago, so the history below
// counts toward adherence from the first day.
export function sampleCreatedAt(today: Date = new Date()): string {
  const day = addDays(today, -SAMPLE_HISTORY_DAYS);
  day.setHours(8, 0, 0, 0);
  return day.toISOString();
}

// A week of believable history: mostly on time, with a missed dose here and there.
// Deterministic, so the demo looks the same every time. Stock isn't touched; the
// sample stock numbers above are the CURRENT amounts.
export function buildSampleLogs(medications: Medication[], today: Date = new Date()): DoseLog[] {
  const logs: DoseLog[] = [];

  medications.forEach((med, medIndex) => {
    if (med.dosesPerDay === 0) return; // as-needed: no schedule to follow

    for (let offset = SAMPLE_HISTORY_DAYS; offset >= 1; offset--) {
      const day = addDays(today, -offset);
      const missed = (medIndex + offset) % 4 === 0 ? 1 : 0;
      const count = Math.max(0, Math.round(med.dosesPerDay) - missed);

      for (let i = 0; i < count; i++) {
        const takenAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8 + i * 5);
        logs.push({
          id: crypto.randomUUID(),
          medicationId: med.id,
          date: localDateKey(day),
          takenAt: takenAt.toISOString(),
        });
      }
    }
  });

  return logs;
}