import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../../Forms";
import { SecondaryButton } from "../../Button";
import { IconInfoCircle } from "../../icons";
import { Tooltip } from "../../Tooltip";
import type { TemplatePreviewData } from "../types";

export function PreviewDataFields({ preview }: { preview: TemplatePreviewData }) {
  const { t } = useTranslation();
  const form = Forms.useFormContext();
  const entries = preview.entries ?? [];
  const annotations = preview.annotations ?? [];

  return (
    <section className="space-y-4" data-test-id="template-preview-data">
      <h2 className="flex items-center gap-2 font-bold">
        <span>{t("Example data")}</span>
        <Tooltip
          content={
            <div className="max-w-xs">
              {t(
                "Use 0 for the current period, -1 for the previous period, and -2 for two periods ago. Periods follow the KPI cadence: months or weeks starting on Monday.",
              )}
            </div>
          }
        >
          <IconInfoCircle className="w-4 h-4 text-content-dimmed cursor-help" />
        </Tooltip>
      </h2>
      {entries.map((_, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-surface-outline p-4">
          <Forms.FieldGroup layout="grid" layoutOptions={{ columns: 2 }}>
            <Forms.NumberInput
              field={`preview_data.entries.${index}.period_offset`}
              label={t("Period offset")}
              step={1}
              required
            />
            <Forms.NumberInput field={`preview_data.entries.${index}.value`} label={t("Value")} step="any" required />
          </Forms.FieldGroup>
          <SecondaryButton
            type="button"
            size="xs"
            testId={`remove-preview-entry-${index}`}
            onClick={() =>
              form.actions.setValue(
                "preview_data.entries",
                entries.filter((_, row) => row !== index),
              )
            }
          >
            {t("Remove")}
          </SecondaryButton>
        </div>
      ))}
      <SecondaryButton
        type="button"
        size="sm"
        testId="add-preview-entry"
        disabled={entries.length >= 200}
        onClick={() => form.actions.setValue("preview_data.entries", [...entries, { period_offset: -1, value: null }])}
      >
        {t("Add measurement")}
      </SecondaryButton>
      <h3 className="font-semibold">{t("Annotations")}</h3>
      {annotations.map((_, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-surface-outline p-4">
          <Forms.NumberInput
            field={`preview_data.annotations.${index}.period_offset`}
            label={t("Period offset")}
            step={1}
            required
          />
          <Forms.TextInput
            field={`preview_data.annotations.${index}.title`}
            label={t("Title", { context: "resource" })}
            required
          />
          <SecondaryButton
            type="button"
            size="xs"
            testId={`remove-preview-annotation-${index}`}
            onClick={() =>
              form.actions.setValue(
                "preview_data.annotations",
                annotations.filter((_, row) => row !== index),
              )
            }
          >
            {t("Remove")}
          </SecondaryButton>
        </div>
      ))}
      <SecondaryButton
        type="button"
        size="sm"
        testId="add-preview-annotation"
        disabled={annotations.length >= 200}
        onClick={() =>
          form.actions.setValue("preview_data.annotations", [...annotations, { period_offset: -1, title: "" }])
        }
      >
        {t("Add annotation")}
      </SecondaryButton>
    </section>
  );
}
