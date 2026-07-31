import React from "react";

import { Form, NumberInput, Submit, useForm } from "../Forms";
import { Modal } from "../Modal";
import type { SpaceKpisPage } from "./types";
import { formatValue, latestEntry } from "./utils";

interface LogUpdateFormProps {
  kpi: SpaceKpisPage.Kpi | null;
  isOpen: boolean;
  onClose: () => void;
  onRecord: (input: SpaceKpisPage.RecordEntryInput) => Promise<SpaceKpisPage.MutationResult>;
}

// Single-KPI "Log update" form → calls the `recordKpiEntry` mutation.
// This POC intentionally has NO "update all KPIs at once" batch UI — one KPI at a time.
export function LogUpdateForm({ kpi, isOpen, onClose, onRecord }: LogUpdateFormProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<{ value: number | null }>({
    fields: { value: null },
    validate: (addError) => {
      if (form.values.value === null || Number.isNaN(form.values.value)) {
        addError("value", "Enter a value");
      }
    },
    submit: async () => {
      if (!kpi || form.values.value === null) return;
      setSubmitError(null);

      const result = await onRecord({ kpiId: kpi.id, value: form.values.value });

      if (result.success) {
        form.actions.reset();
        onClose();
      } else {
        setSubmitError(result.error ?? "Something went wrong. Please try again.");
      }
    },
    cancel: onClose,
  });

  if (!kpi) return null;

  const latest = latestEntry(kpi);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log update — ${kpi.name}`}
      size="x-small"
      testId="log-update-modal"
    >
      <Form form={form}>
        <p className="mb-4 text-sm text-content-dimmed">
          Record the current value in <span className="font-medium text-content-base">{kpi.unit}</span>.
          {latest ? (
            <>
              {" "}
              Last recorded value was{" "}
              <span className="font-medium text-content-base">{formatValue(latest.value, kpi.unit)}</span>.
            </>
          ) : (
            " This will be the first recorded value."
          )}
        </p>

        <NumberInput field="value" label={`Value (${kpi.unit})`} placeholder="0" autoFocus required />

        {submitError && (
          <div className="mt-4 text-sm text-content-error" data-test-id="log-update-error">
            {submitError}
          </div>
        )}

        <Submit saveText="Record update" cancelText="Cancel" />
      </Form>
    </Modal>
  );
}
