import { countTakenOn, localDateKey, type DoseLog } from './dose-log';
import type { Medication } from './medications';

export type DayAdherence = {
  date: string; // local calendar day, YYYY-MM-DD
  expected: number;
  taken: number;
  percent: number | null; // null when nothing was expected that day
};

export type WeeklyAdherence = {
  days: DayAdherence[]; // oldest first
  percent: number | null;
};

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toPercent(taken: number, expected: number) {
  return expected > 0 ? Math.round((taken / expected) * 100) : null;
}

// Adherence over the last `windowDays` COMPLETED days (today is excluded, since
// it isn't over yet). Rules:
// - Only scheduled medications count; as-needed ones have nothing to follow.
// - Credit per medication per day is capped at its daily doses, so extra doses
//   can't make up for missed ones.
// - Tracking starts on the day of the first logged dose, and a medication only
//   counts from the day it was added. Days before that aren't misses.
// - It uses each medication's CURRENT doses per day, so editing a schedule
//   re-judges past days. Fine for a local-first prototype.
export function weeklyAdherence(
  medications: Medication[],
  logs: DoseLog[],
  today: Date = new Date(),
  windowDays = 7,
): WeeklyAdherence {
  const scheduled = medications.filter((m) => m.dosesPerDay > 0);
  const trackingStart =
    logs.length > 0 ? logs.reduce((min, l) => (l.date < min ? l.date : min), logs[0].date) : null;

  const days: DayAdherence[] = [];
  let totalExpected = 0;
  let totalTaken = 0;

  for (let offset = windowDays; offset >= 1; offset--) {
    const date = localDateKey(addDays(today, -offset));
    let expected = 0;
    let taken = 0;

    if (trackingStart !== null && date >= trackingStart) {
      for (const med of scheduled) {
        if (localDateKey(new Date(med.createdAt)) > date) continue; // not added yet that day
        expected += med.dosesPerDay;
        taken += Math.min(countTakenOn(logs, med.id, date), med.dosesPerDay);
      }
    }

    days.push({ date, expected, taken, percent: toPercent(taken, expected) });
    totalExpected += expected;
    totalTaken += taken;
  }

  return { days, percent: toPercent(totalTaken, totalExpected) };
}