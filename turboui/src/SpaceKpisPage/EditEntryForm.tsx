import React from "react";

import { Form, NumberInput, Submit, useForm } from "../Forms";
import { Modal } from "../Modal";
import type { SpaceKpisPage } from "./types";
import { formatShortDate, toIsoDate } from "./utils";

interface EditEntryFormProps {
  kpi: SpaceKpisPage.Kpi | null;
  entry: SpaceKpisPage.KpiEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (input: SpaceKpisPage.EditEntryInput) => Promise<SpaceKpisPage.MutationResult>;
}

export function EditEntryForm({ kpi, entry, isOpen, onClose, onEdit }: EditEntryFormProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<{ value: string; period: string }>({
    fields: {
      value: entry ? String(entry.value) : "",
      period: entry ? toIsoDate(entry.recordedAt) : "",
    },
    validate: (addError) => {
      if (form.values.value.trim() === "" || Number.isNaN(Number(form.values.value))) {
        addError("value", "Enter a value");
      }
      if (!form.values.period) {
        addError("period", "Choose a date");
      }
    },
    submit: async () => {
      if (!entry) return;
      setSubmitError(null);

      const result = await onEdit({
        entryId: entry.id,
        value: Number(form.values.value),
        period: form.values.period,
      });

      if (result.success) {
        onClose();
      } else {
        setSubmitError(result.error ?? "Something went wrong. Please try again.");
      }
    },
    cancel: onClose,
  });

  React.useEffect(() => {
    if (!isOpen || !entry) return;

    form.actions.setValue("value", String(entry.value));
    form.actions.setValue("period", toIsoDate(entry.recordedAt));
    setSubmitError(null);
    // The form identity is stable for the open entry; reset only when that entry or the modal changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entry?.id]);

  if (!kpi || !entry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit update — ${kpi.name}`}
      size="x-small"
      testId="edit-entry-modal"
    >
      <Form form={form}>
        <p className="mb-4 text-sm text-content-dimmed">
          Correct the value recorded on{" "}
          <span className="font-medium text-content-base">{formatShortDate(entry.recordedAt)}</span>. The previous
          number stays visible on this update.
        </p>

        <div className="space-y-2">
          <NumberInput field="value" label={`Value (${kpi.unit})`} placeholder="0" autoFocus required />

          <div>
            <label htmlFor="edit-kpi-entry-period" className="mb-1 block text-sm font-medium text-content-accent">
              Date
            </label>
            <input
              id="edit-kpi-entry-period"
              type="date"
              value={form.values.period}
              onChange={(event) => form.actions.setValue("period", event.target.value)}
              className="w-full rounded-lg border border-surface-outline bg-surface-base px-3 py-1.5 text-sm text-content-accent"
              data-test-id="edit-entry-period"
            />
            {form.errors["period"] && <div className="mt-1 text-sm text-content-error">{form.errors["period"]}</div>}
          </div>
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-content-error" data-test-id="edit-entry-error">
            {submitError}
          </div>
        )}

        <Submit saveText="Save changes" cancelText="Cancel" />
      </Form>
    </Modal>
  );
}
