import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { AddKpiDataPointInput, Kpi } from "./types";

interface LogDataPointFormProps {
  kpi: Kpi;
  /** Resolves on success; reject/throw with an Error to surface a form-level error. */
  onSubmit: (input: AddKpiDataPointInput) => Promise<void>;
  onCancel?: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Bare-bones "log a data point" form (value + period date).
 *
 * Mirrors the proposed `add_kpi_data_point` mutation. The duplicate-period
 * rejection is enforced server-side via a unique index on
 * (kpi_id, recorded_for); this form surfaces that error inline. For the POC we
 * also guard client-side to give immediate feedback.
 */
export function LogDataPointForm({ kpi, onSubmit, onCancel }: LogDataPointFormProps) {
  const [value, setValue] = React.useState("");
  const [recordedFor, setRecordedFor] = React.useState(today());
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const existingDates = React.useMemo(() => new Set(kpi.dataPoints.map((d) => d.recordedFor)), [kpi.dataPoints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numeric = Number(value);
    if (value.trim() === "" || Number.isNaN(numeric)) {
      setError("Enter a numeric value.");
      return;
    }

    if (existingDates.has(recordedFor)) {
      setError(`A data point for ${recordedFor} already exists. Each period can only be logged once.`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ kpiId: kpi.id, value: numeric, recordedFor });
      setValue("");
      setRecordedFor(today());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-test-id="log-data-point-form">
      <div className="text-sm text-content-dimmed">
        Logging a <span className="font-bold text-content-base">{kpi.cadence}</span> value for{" "}
        <span className="font-bold text-content-base">{kpi.name}</span>
        {kpi.unit ? ` (${kpi.unit})` : ""}.
      </div>

      {error && <ErrorCallout message={error} testId="log-data-point-error" />}

      <Field label={kpi.unit ? `Value (${kpi.unit})` : "Value"}>
        <input
          className={inputClass}
          value={value}
          autoFocus
          inputMode="decimal"
          placeholder="e.g. 128"
          onChange={(e) => setValue(e.target.value)}
          data-test-id="data-point-value"
        />
      </Field>

      <Field label="Period" hint="The date this value represents (recorded_for)">
        <input
          type="date"
          className={inputClass}
          value={recordedFor}
          onChange={(e) => setRecordedFor(e.target.value)}
          data-test-id="data-point-date"
        />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <PrimaryButton type="submit" loading={submitting} disabled={submitting} testId="submit-data-point">
          Log data point
        </PrimaryButton>
        {onCancel && (
          <SecondaryButton type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </SecondaryButton>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-surface-outline bg-surface-base text-content-base " +
  "placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-brand-1";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-bold text-content-base mb-1">{label}</div>
      {children}
      {hint && <div className="text-xs text-content-subtle mt-1">{hint}</div>}
    </label>
  );
}
