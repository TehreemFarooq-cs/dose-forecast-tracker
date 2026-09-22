import { describe, it, expect } from 'vitest';
import { getRefillForecast } from './tools';

// The AI SDK's execute signature expects an options object as the second
// argument (toolCallId, messages, etc.) — irrelevant to our pure logic, so
// we cast to bypass it rather than construct a full fake context.
const runTool = getRefillForecast.execute as any;

describe('getRefillForecast', () => {
  it('calculates days remaining and refill date correctly', async () => {
    const result = await runTool({
      drugName: 'Drug A',
      pillsRemaining: 14,
      dosesPerDay: 2,
    });

    expect(result.daysRemaining).toBe(7);
    expect(result.drugName).toBe('Drug A');
    expect(result.refillByDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
  });

  it('marks status as "critical" when 2 or fewer days remain', async () => {
    const result = await runTool({
      drugName: 'Drug A',
      pillsRemaining: 2,
      dosesPerDay: 2,
    });

    expect(result.daysRemaining).toBe(1);
    expect(result.status).toBe('critical');
  });

  it('marks status as "low" when between 3 and 7 days remain', async () => {
    const result = await runTool({
      drugName: 'Drug A',
      pillsRemaining: 14,
      dosesPerDay: 2, // 7 days remaining — boundary case
    });

    expect(result.status).toBe('low');
  });

  it('marks status as "ok" when more than 7 days remain', async () => {
    const result = await runTool({
      drugName: 'Drug A',
      pillsRemaining: 20,
      dosesPerDay: 2, // 10 days remaining
    });

    expect(result.status).toBe('ok');
  });

  it('throws a descriptive error for as-needed (0 doses/day) medications', async () => {
    await expect(
      runTool({
        drugName: 'Drug A',
        pillsRemaining: 10,
        dosesPerDay: 0,
      })
    ).rejects.toThrow(/as-needed/i);
  });
});