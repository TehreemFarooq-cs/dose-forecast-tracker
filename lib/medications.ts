import { z } from 'zod';

export type Medication = {
  id: string;
  name: string;
  pillsRemaining: number;
  dosesPerDay: number; // 0 = as-needed
  createdAt: string; // ISO timestamp
};

// Validation shared by the form, the store, and (later) the chat tools.
export const medicationInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Keep the name under 60 characters'),
  pillsRemaining: z.number().int('Whole pills only').min(0, 'Cannot be negative').max(10000),
  dosesPerDay: z.number().min(0, 'Cannot be negative').max(24, 'That seems too high'),
});

export type MedicationInput = z.infer<typeof medicationInputSchema>;