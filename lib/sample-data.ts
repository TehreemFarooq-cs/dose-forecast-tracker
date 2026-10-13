import type { MedicationInput } from './medications';

// One of each status so the dashboard shows its full range.
export const sampleMedications: MedicationInput[] = [
  { name: 'Amoxicillin', pillsRemaining: 3, dosesPerDay: 3 }, // 1 day  → critical
  { name: 'Vitamin D', pillsRemaining: 5, dosesPerDay: 1 }, //   5 days → low
  { name: 'Metformin', pillsRemaining: 60, dosesPerDay: 2 }, //  30 days → ok
  { name: 'Ibuprofen', pillsRemaining: 12, dosesPerDay: 0 }, //  as-needed
];