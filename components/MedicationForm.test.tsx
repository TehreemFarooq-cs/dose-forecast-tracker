import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MedicationForm from './MedicationForm';

describe('MedicationForm', () => {
  it('shows errors and does not submit when fields are empty', async () => {
    const onSubmit = vi.fn();
    render(<MedicationForm submitLabel="Add medication" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits parsed numbers for valid input', async () => {
    const onSubmit = vi.fn();
    render(<MedicationForm submitLabel="Add medication" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Medication name'), 'Drug A');
    await userEvent.type(screen.getByLabelText('Pills remaining'), '14');
    await userEvent.type(screen.getByLabelText('Doses per day'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Drug A',
      pillsRemaining: 14,
      dosesPerDay: 2,
    });
  });
});