type ApprovalProps = {
  title: string;
  lines?: string[];
  note?: string;
  approveLabel?: string;
  declineLabel?: string;
  busy?: boolean;
  onApprove?: () => void; // omit to show only the decline/dismiss button
  onDecline: () => void;
};

// Shown while the assistant is waiting for the user to approve or decline a change.
export function ToolApprovalCard({
  title,
  lines = [],
  note,
  approveLabel = 'Approve',
  declineLabel = 'Decline',
  busy = false,
  onApprove,
  onDecline,
}: ApprovalProps) {
  return (
    <div
      role="group"
      aria-label={title}
      className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 my-2 text-sm text-gray-800"
    >
      <p className="font-semibold mb-1">{title}</p>
      {lines.length > 0 && (
        <ul className="mb-2 text-gray-700">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {note && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded p-2 mb-2">
          {note}
        </p>
      )}
      <div className="flex gap-2">
        {onApprove && (
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Saving…' : approveLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onDecline}
          disabled={busy}
          className="border border-gray-300 bg-white text-gray-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {declineLabel}
        </button>
      </div>
    </div>
  );
}

const TONES = {
  success: 'border-green-300 bg-green-50 text-green-800',
  neutral: 'border-gray-300 bg-gray-50 text-gray-700',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  error: 'border-red-300 bg-red-50 text-red-800',
} as const;

// Shown after the user answered (or the change failed).
export function ToolOutcomeCard({
  tone,
  title,
  detail,
}: {
  tone: keyof typeof TONES;
  title: string;
  detail?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border-2 p-3 my-2 text-sm ${TONES[tone]}`}
    >
      <p className="font-semibold">{title}</p>
      {detail && <p className="mt-1">{detail}</p>}
    </div>
  );
}