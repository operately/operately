import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../../Forms";
import { SecondaryButton } from "../../Button";
import type { TemplatePreviewData } from "../types";

export function PreviewDataFields({ preview }: { preview: TemplatePreviewData }) {
  const { t } = useTranslation();
  const form = Forms.useFormContext();
  const entries = preview.entries ?? [];
  const annotations = preview.annotations ?? [];

  return (
    <section className="space-y-4" data-test-id="template-preview-data">
      <h2 className="font-bold">{t("Example data")}</h2>
      {entries.map((_, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-surface-outline p-4">
          <Forms.FieldGroup layout="grid" layoutOptions={{ columns: 2 }}>
            <Forms.DateInput field={`preview_data.entries.${index}.date`} label={t("Date")} required />
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
        onClick={() => form.actions.setValue("preview_data.entries", [...entries, { date: "", value: null }])}
      >
        {t("Add measurement")}
      </SecondaryButton>
      <h3 className="font-semibold">{t("Annotations")}</h3>
      {annotations.map((_, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-surface-outline p-4">
          <Forms.DateInput field={`preview_data.annotations.${index}.date`} label={t("Date")} required />
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
        onClick={() => form.actions.setValue("preview_data.annotations", [...annotations, { date: "", title: "" }])}
      >
        {t("Add annotation")}
      </SecondaryButton>
    </section>
  );
}
