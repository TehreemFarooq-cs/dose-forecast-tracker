export type RefillStatus = 'ok' | 'low' | 'critical';

export type RefillForecast = {
  drugName: string;
  pillsRemaining: number;
  dosesPerDay: number;
  daysRemaining: number;
  refillByDate: string; // YYYY-MM-DD
  status: RefillStatus;
};

export function calculateRefillForecast(
  input: { drugName: string; pillsRemaining: number; dosesPerDay: number },
  today: Date = new Date(),
): RefillForecast {
  const { drugName, pillsRemaining, dosesPerDay } = input;

  if (dosesPerDay === 0) {
    throw new Error(
      `${drugName} is marked as as-needed (0 doses/day), so a refill date can't be calculated automatically.`,
    );
  }

  const daysRemaining = Math.floor(pillsRemaining / dosesPerDay);

  const refillBy = new Date(today);
  refillBy.setDate(refillBy.getDate() + daysRemaining);

  let status: RefillStatus;
  if (daysRemaining > 7) status = 'ok';
  else if (daysRemaining > 2) status = 'low';
  else status = 'critical';

  return {
    drugName,
    pillsRemaining,
    dosesPerDay,
    daysRemaining,
    refillByDate: refillBy.toISOString().split('T')[0],
    status,
  };
}