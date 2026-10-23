import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolApprovalCard } from './ToolApprovalCard';

const base = {
  title: 'Add this medication?',
  lines: ['Amoxicillin', '3 pills in stock'],
  approveLabel: 'Add medication',
};

describe('ToolApprovalCard', () => {
  it('shows what will change', () => {
    render(<ToolApprovalCard {...base} onApprove={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Add this medication?' })).toBeInTheDocument();
    expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
    expect(screen.getByText('3 pills in stock')).toBeInTheDocument();
  });

  it('calls the matching handler for each button', async () => {
    const onApprove = vi.fn();
    const onDecline = vi.fn();
    render(<ToolApprovalCard {...base} onApprove={onApprove} onDecline={onDecline} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add medication' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while saving', () => {
    render(<ToolApprovalCard {...base} busy onApprove={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled();
  });

  it('offers only a dismiss button when there is nothing to approve', () => {
    render(
      <ToolApprovalCard
        title="Can't update that"
        note="There's no saved medication named Aspirin."
        declineLabel="Dismiss"
        onDecline={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });
});