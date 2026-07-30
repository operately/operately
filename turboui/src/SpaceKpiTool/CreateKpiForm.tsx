import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { CreateKpiInput, KpiCadence } from "./types";

interface CreateKpiFormProps {
  /** Resolves on success; reject/throw with an Error to surface a form-level error. */
  onSubmit: (input: CreateKpiInput) => Promise<void>;
  onCancel?: () => void;
}

const CADENCES: { value: KpiCadence; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

/**
 * Bare-bones "create a KPI" form (name, unit, cadence).
 *
 * Mirrors the shape of the proposed `create_kpi` mutation. Validation here is
 * intentionally minimal for the POC — the hardening PR should move rules into
 * the operation/changeset (`Operately.Operations.CreateKpi`).
 */
export function CreateKpiForm({ onSubmit, onCancel }: CreateKpiFormProps) {
  const [name, setName] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [cadence, setCadence] = React.useState<KpiCadence>("weekly");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), unit: unit.trim(), cadence });
      setName("");
      setUnit("");
      setCadence("weekly");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-test-id="create-kpi-form">
      {error && <ErrorCallout message={error} testId="create-kpi-error" />}

      <Field label="Name">
        <input
          className={inputClass}
          value={name}
          autoFocus
          placeholder="e.g. Weekly signups"
          onChange={(e) => setName(e.target.value)}
          data-test-id="kpi-name"
        />
      </Field>

      <Field label="Unit" hint="Shown next to values, e.g. $, %, users">
        <input
          className={inputClass}
          value={unit}
          placeholder="e.g. users"
          onChange={(e) => setUnit(e.target.value)}
          data-test-id="kpi-unit"
        />
      </Field>

      <Field label="Cadence">
        <div className="flex gap-2">
          {CADENCES.map((c) => {
            const active = cadence === c.value;
            return (
              <button
                type="button"
                key={c.value}
                onClick={() => setCadence(c.value)}
                data-test-id={`kpi-cadence-${c.value}`}
                className={
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors " +
                  (active
                    ? "bg-brand-1 border-brand-1 text-white-1"
                    : "bg-surface-base border-surface-outline text-content-base hover:bg-surface-dimmed")
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <PrimaryButton type="submit" loading={submitting} disabled={submitting} testId="submit-create-kpi">
          Create KPI
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
