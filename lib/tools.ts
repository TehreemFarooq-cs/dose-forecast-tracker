import { tool } from 'ai';
import { z } from 'zod';
import { calculateRefillForecast } from './forecast';

// Server-side tool: runs on the server and returns a forecast card.
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

// Client-side tools: no `execute` on purpose. The medication list lives in the
// browser, so the UI shows an approval card, writes to the store itself, and
// reports back with addToolOutput.
export const addMedication = tool({
  description:
    "Propose adding a new medication to the user's saved list. The user approves the " +
    'change in the app before it is saved. Use it when the user asks to add or start ' +
    'tracking a medication, once you have its name, pills remaining, and doses per day.',
  inputSchema: z.object({
    name: z.string().min(1).max(60).describe('Medication name, e.g. "Amoxicillin".'),
    pillsRemaining: z.number().int().min(0).describe('Pills currently in stock.'),
    dosesPerDay: z
      .number()
      .min(0)
      .max(24)
      .describe('Doses taken per day. Use 0 for as-needed medications.'),
  }),
  outputSchema: z.object({
    status: z.enum(['saved', 'declined']),
    name: z.string(),
  }),
});

export const updateMedicationStock = tool({
  description:
    "Propose a new pill count for a medication that is already on the user's saved list. " +
    'The user approves the change in the app before it is saved. Use it when the user ' +
    'says how many pills they have now or that they picked up more.',
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .max(60)
      .describe('Name of a medication that is already on the saved list.'),
    pillsRemaining: z
      .number()
      .int()
      .min(0)
      .describe('The NEW TOTAL number of pills in stock, not the amount added.'),
  }),
  outputSchema: z.object({
    status: z.enum(['updated', 'declined', 'not_found']),
    name: z.string(),
  }),
});

export const tools = { getRefillForecast, addMedication, updateMedicationStock };