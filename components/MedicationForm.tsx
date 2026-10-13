'use client';

import { useId, useState } from 'react';
import { medicationInputSchema, type MedicationInput } from '@/lib/medications';

type Props = {
  initial?: MedicationInput;
  submitLabel: string;
  onSubmit: (input: MedicationInput) => Promise<void> | void;
  onCancel?: () => void;
};

type Errors = Partial<Record<keyof MedicationInput, string>>;

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: 'text' | 'number';
  min?: number;
  step?: number;
};

function Field({ id, label, value, onChange, error, hint, type = 'text', min, step }: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        step={step}
        inputMode={type === 'number' ? 'decimal' : undefined}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {hint && (
        <p id={hintId} className="text-xs text-gray-500 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-700 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function MedicationForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const uid = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [pills, setPills] = useState(initial ? String(initial.pillsRemaining) : '');
  const [doses, setDoses] = useState(initial ? String(initial.dosesPerDay) : '');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const next: Errors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (pills.trim() === '') next.pillsRemaining = 'Enter how many pills are left';
    if (doses.trim() === '') next.dosesPerDay = 'Enter doses per day (0 if as-needed)';

    if (Object.keys(next).length === 0) {
      const parsed = medicationInputSchema.safeParse({
        name,
        pillsRemaining: Number(pills),
        dosesPerDay: Number(doses),
      });

      if (parsed.success) {
        setErrors({});
        setSubmitting(true);
        try {
          await onSubmit(parsed.data);
        } finally {
          setSubmitting(false);
        }
        return;
      }

      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MedicationInput;
        if (!next[key]) next[key] = issue.message;
      }
    }

    setErrors(next);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <Field
        id={`${uid}-name`}
        label="Medication name"
        value={name}
        onChange={setName}
        error={errors.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          id={`${uid}-pills`}
          label="Pills remaining"
          type="number"
          min={0}
          step={1}
          value={pills}
          onChange={setPills}
          error={errors.pillsRemaining}
        />
        <Field
          id={`${uid}-doses`}
          label="Doses per day"
          type="number"
          min={0}
          step={0.5}
          value={doses}
          onChange={setDoses}
          error={errors.dosesPerDay}
          hint="Use 0 for as-needed"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}