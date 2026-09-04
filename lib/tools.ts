import { tool } from 'ai';
import { z } from 'zod';

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
        'How many doses are taken per day. Use 0 for as-needed (PRN) medications.'
      ),
  }),
  execute: async ({ drugName, pillsRemaining, dosesPerDay }) => {
    if (dosesPerDay === 0) {
      throw new Error(
        `${drugName} is marked as as-needed (0 doses/day), so a refill date can't be calculated automatically.`
      );
    }

    const daysRemaining = Math.floor(pillsRemaining / dosesPerDay);

    const refillByDate = new Date();
    refillByDate.setDate(refillByDate.getDate() + daysRemaining);

    let status: 'ok' | 'low' | 'critical';
    if (daysRemaining > 7) status = 'ok';
    else if (daysRemaining > 2) status = 'low';
    else status = 'critical';

    return {
      drugName,
      pillsRemaining,
      dosesPerDay,
      daysRemaining,
      refillByDate: refillByDate.toISOString().split('T')[0], // YYYY-MM-DD
      status,
    };
  },
});
export const tools = { getRefillForecast };