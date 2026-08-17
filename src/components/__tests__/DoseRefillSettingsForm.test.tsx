import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DoseRefillSettingsForm } from '../DoseRefillSettingsForm';
import '@testing-library/jest-dom';

describe('DoseRefillSettingsForm', () => {
  it('renders with initial default values', () => {
    render(<DoseRefillSettingsForm onSave={vi.fn()} />);
    expect(screen.getByLabelText(/Medication Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Inventory/i)).toHaveValue(0);
  });

  it('shows validation errors on invalid input', async () => {
    render(<DoseRefillSettingsForm onSave={vi.fn()} />);
    
    // Trigger validation by submitting
    fireEvent.click(screen.getByText(/Save Settings/i));

    expect(await screen.findByText(/Medication Name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Threshold must be > 0 and < current inventory/i)).toBeInTheDocument();
  });

  it('calls onSave with correct data upon valid submission', async () => {
    const onSave = vi.fn();
    render(<DoseRefillSettingsForm onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/Medication Name/i), { target: { value: 'Aspirin' } });
    fireEvent.change(screen.getByLabelText(/Current Inventory/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Refill Threshold/i), { target: { value: '5' } });

    fireEvent.click(screen.getByText(/Save Settings/i));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        medicationName: 'Aspirin',
        currentInventory: '10',
        refillThreshold: '5',
      }));
    });
  });
});
