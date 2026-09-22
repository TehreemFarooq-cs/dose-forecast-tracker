import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RefillForecastCard from './RefillForecastCard';

const baseResult = {
  drugName: 'Drug A',
  pillsRemaining: 14,
  dosesPerDay: 2,
  daysRemaining: 7,
  refillByDate: '2026-09-11',
  status: 'low' as const,
};

describe('RefillForecastCard', () => {
  it('renders the drug name and key details', () => {
    render(<RefillForecastCard result={baseResult} />);

    expect(screen.getByText('Drug A')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('2026-09-11')).toBeInTheDocument();
  });

  it('shows the correct label for "critical" status', () => {
    render(<RefillForecastCard result={{ ...baseResult, status: 'critical' }} />);
    expect(screen.getByText('Refill now')).toBeInTheDocument();
  });

  it('shows the correct label for "ok" status', () => {
    render(<RefillForecastCard result={{ ...baseResult, status: 'ok' }} />);
    expect(screen.getByText('On track')).toBeInTheDocument();
  });
});