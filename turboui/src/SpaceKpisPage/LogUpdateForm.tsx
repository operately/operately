import { KpiDate, useKpiFormatting } from "./formatting";
import React from "react";
import { useTranslation } from "react-i18next";
import { Trans } from "../Translate";

import { Form, NumberInput, RichTextArea, Submit, useForm } from "../Forms";
import { Modal } from "../Modal";
import { emptyContent, isContentEmpty } from "../RichContent";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { SpaceKpisPage } from "./types";
import { fromIsoDate, latestEntry } from "./utils";

interface LogUpdateFormProps {
  kpi: SpaceKpisPage.Kpi | null;
  isOpen: boolean;
  onClose: () => void;
  onRecord: (input: SpaceKpisPage.RecordEntryInput) => Promise<SpaceKpisPage.MutationResult>;
  richTextHandlers: RichEditorHandlers;
}

// Local `YYYY-MM-DD` for today, used as the default period so logging is a
// one-tap action for the common "record today's value" case.
function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

// Single-KPI "Log update" form → calls the `logKpiEntry` mutation.
// This POC intentionally has NO "update all KPIs at once" batch UI — one KPI at a time.
export function LogUpdateForm({ kpi, isOpen, onClose, onRecord, richTextHandlers }: LogUpdateFormProps) {
  const { formatValue } = useKpiFormatting();
  const { t } = useTranslation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // The date defaults to today and stays a low-prominence affordance; revealing
  // the full date picker is an explicit opt-in for the rarer "backfill an older
  // period" case.
  const [editingPeriod, setEditingPeriod] = React.useState(false);
  const periodInputRef = React.useRef<HTMLInputElement>(null);

  // `value` is stored as a string because NumberInput is text-backed; it is
  // coerced to a number on submit for the mutation. `note` holds rich text and
  // is posted as the update's first comment when it isn't left blank.
  const form = useForm<{ value: string; period: string; note: Record<string, unknown> }>({
    fields: { value: "", period: today(), note: emptyContent() },
    validate: (addError) => {
      if (form.values.value.trim() === "" || Number.isNaN(Number(form.values.value))) {
        addError("value", t("Enter a value"));
      }
      if (!form.values.period) {
        addError("period", t("Choose a period"));
      }
    },
    submit: async () => {
      if (!kpi) return;
      setSubmitError(null);

      const note = form.values.note;
      const result = await onRecord({
        kpiId: kpi.id,
        value: Number(form.values.value),
        period: form.values.period,
        comment: isContentEmpty(note) ? undefined : note,
      });

      if (result.success) {
        form.actions.reset();
        setEditingPeriod(false);
        onClose();
      } else {
        setSubmitError(result.error ?? t("Something went wrong. Please try again."));
      }
    },
    cancel: onClose,
  });

  // Move focus to the date input as soon as it is revealed so the "Change date"
  // control stays fully keyboard operable.
  React.useEffect(() => {
    if (editingPeriod) periodInputRef.current?.focus();
  }, [editingPeriod]);

  if (!kpi) return null;

  const latest = latestEntry(kpi);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("Log update — {{name}}", { name: kpi.name })}
      size="x-small"
      testId="log-update-modal"
    >
      <Form form={form}>
        <p className="mb-4 text-sm text-content-dimmed">
          <Trans
            i18nKey="Record the current value in <unit>{{unit}}</unit>."
            values={{ unit: kpi.unit }}
            components={{ unit: <span className="font-medium text-content-base" /> }}
          />
          {latest ? (
            <>
              {" "}
              <Trans
                i18nKey="Last recorded value was <value>{{value}}</value>."
                values={{ value: formatValue(latest.value, kpi.unit) }}
                components={{ value: <span className="font-medium text-content-base" /> }}
              />
            </>
          ) : (
            <> {t("This will be the first recorded value.")}</>
          )}
        </p>

        <div className="space-y-2">
          <NumberInput
            field="value"
            label={t("Value ({{unit}})", { unit: kpi.unit })}
            placeholder="0"
            autoFocus
            required
          />

          {editingPeriod ? (
            <div>
              <label htmlFor="kpi-entry-period" className="block text-sm font-medium text-content-accent mb-1">
                {t("Date")}
              </label>
              <input
                ref={periodInputRef}
                id="kpi-entry-period"
                type="date"
                value={form.values.period}
                onChange={(event) => form.actions.setValue("period", event.target.value)}
                className="w-full rounded-lg border border-surface-outline bg-surface-base px-3 py-1.5 text-sm text-content-accent"
                data-test-id="log-update-period"
              />
              {form.errors["period"] && <div className="mt-1 text-sm text-content-error">{form.errors["period"]}</div>}
            </div>
          ) : (
            <div
              className="flex items-center gap-2 text-sm text-content-dimmed"
              data-test-id="log-update-period-summary"
            >
              <span>
                {form.values.period === today() ? (
                  <Trans
                    i18nKey="Logging for <date>today</date>"
                    components={{ date: <span className="font-medium text-content-base" /> }}
                  />
                ) : (
                  <Trans
                    i18nKey="Logging for <date/>"
                    components={{
                      date: (
                        <KpiDate className="font-medium text-content-base" time={fromIsoDate(form.values.period)} />
                      ),
                    }}
                  />
                )}
              </span>
              <button
                type="button"
                onClick={() => setEditingPeriod(true)}
                className="font-medium text-link-base hover:underline"
                data-test-id="log-update-change-date"
              >
                {t("Change date")}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <RichTextArea
            field="note"
            label={t("Note (optional)")}
            placeholder={t("What's behind this number?")}
            richTextHandlers={richTextHandlers}
            height="min-h-[80px]"
            hideToolbar
          />
          <p className="mt-1 text-xs text-content-dimmed">{t("Posted as the first comment on this update.")}</p>
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-content-error" data-test-id="log-update-error">
            {submitError}
          </div>
        )}

        <Submit saveText={t("Record update")} cancelText={t("Cancel")} />
      </Form>
    </Modal>
  );
}
