import { tool } from 'ai';
import { z } from 'zod';
import { calculateRefillForecast } from './forecast';

export const getRefillForecast = tool({
  description:
    'Calculate when a medication will run out and needs a refill, based on ' +
    'current pill count and daily dosage. Use this whenever the user asks ' +
    'about refill timing, running out of medication, or how long their ' +
    'current supply will last.',
  inputSchema: z.object({
    drugName: z
      .string()
      .min(1)
      .describe('The name of the medication, e.g. "Drug A" or "Amoxicillin".'),
    pillsRemaining: z
      .number()
      .int()
      .min(0)
      .describe('How many pills or doses are currently left in stock.'),
    dosesPerDay: z
      .number()
      .min(0)
      .describe(
        'How many doses are taken per day. Use 0 for as-needed (PRN) medications.',
      ),
  }),
  execute: async (input) => calculateRefillForecast(input),
});

export const tools = { getRefillForecast };