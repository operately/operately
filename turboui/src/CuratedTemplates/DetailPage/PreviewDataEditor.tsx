import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../../Forms";
import { showSuccessToast } from "../../Toasts";
import { translationText } from "../../i18n";
import type { CuratedTemplate, TemplateMutationResult, TemplatePreviewData } from "../types";
import { PreviewDataFields } from "./PreviewDataFields";
import { numeric } from "./definition";
import { ValidationFailure } from "./ValidationFailure";

interface Props {
  template: CuratedTemplate;
  onSave: (previewData: string) => Promise<TemplateMutationResult>;
}

export function PreviewDataEditor({ template, onSave }: Props) {
  const { t } = useTranslation();
  const form = Forms.useForm({
    fields: { preview_data: JSON.parse(template.previewData ?? "{}") as TemplatePreviewData },
    submit: async () => {
      const preview = form.values.preview_data;
      const result = await onSave(
        JSON.stringify({
          entries: (preview.entries ?? []).map(({ period_offset, value }) => ({
            period_offset: numeric(period_offset),
            value: numeric(value),
          })),
          annotations: (preview.annotations ?? []).map(({ period_offset, title }) => ({
            period_offset: numeric(period_offset),
            title,
          })),
        }),
      );
      if (result.errors.length) throw new ValidationFailure(result.errors);
      showSuccessToast(t("Success"), t("The example data has been saved."));
    },
    onError: (error: unknown) => {
      form.actions.addErrors(
        error instanceof ValidationFailure
          ? Object.fromEntries(error.errors.map(({ path, message }) => [path, message]))
          : {
              base: t(
                "The template could not be saved. Your edits have been kept. Reload if another admin has changed it.",
              ),
            },
      );
    },
  });

  return (
    <Forms.Form form={form} testId="template-preview-data-form">
      <Forms.FieldGroup>
        <PreviewDataFields preview={form.values.preview_data} />
      </Forms.FieldGroup>
      {form.hasErrors && (
        <div className="mt-4" data-test-id="preview-data-errors">
          {Object.entries(form.errors).map(([path, message]) => (
            <Forms.ErrorMessage key={path} error={message} />
          ))}
        </div>
      )}
      <Forms.Submit testId="save-preview-data" saveText={translationText(t("Save example data"))} />
    </Forms.Form>
  );
}
