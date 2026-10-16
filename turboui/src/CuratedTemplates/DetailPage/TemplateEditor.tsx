import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../../Forms";
import { showSuccessToast } from "../../Toasts";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { DimmedActionLink } from "../../Link";
import { numeric, readDefinition, serializeDefinition } from "./definition";
import { Tabs } from "../../Tabs";
import { PreviewDataFields } from "./PreviewDataFields";
import { DefinitionFields } from "./DefinitionFields";
import { ValidationFailure } from "./ValidationFailure";
import type {
  TemplateDefinition,
  TemplateInput,
  TemplatePreviewData,
  TemplateType,
  TemplateValidationError,
} from "../types";
import type { TemplateEditorProps } from "./types";

export function TemplateEditor(props: TemplateEditorProps) {
  const { t } = useTranslation();
  const initial = React.useMemo(
    () => ({
      title: props.template?.title ?? "",
      slug: props.template?.slug ?? "",
      type: props.template?.type ?? ("kpi" as TemplateType),
      summary: props.template?.summary ?? "",
      category: props.template?.category ?? "",
      content_language: props.template?.contentLanguage ?? "en",
      preview_data: JSON.parse(props.template?.previewData ?? "{}") as TemplatePreviewData,
      definition: props.template ? readDefinition(props.template.definition) : ({} as TemplateDefinition),
    }),
    [props.template],
  );
  const [tab, setTab] = React.useState("template");
  const slugEdited = React.useRef(false);
  const published = props.template?.state === "published";
  const [saveIntent, setSaveIntent] = React.useState<"draft" | "publish">("publish");
  const form = Forms.useForm({
    fields: initial,
    cancel: props.onCancel,
    submit: async (intent) => {
      const action = intent === "draft" ? "draft" : "publish";
      setSaveIntent(action);
      const result = await props.onSave(input(), action);
      if (result.errors.length) throw new ValidationFailure(result.errors);
      showSuccessToast(t("Success"), t("The template has been saved."));
    },
    onError: (error: unknown) => {
      if (error instanceof ValidationFailure) showErrors(error.errors);
      else
        form.actions.addErrors({
          base: t(
            "The template could not be saved. Your edits have been kept. Reload if another admin has changed it.",
          ),
        });
    },
  });
  React.useEffect(() => {
    if (props.validationErrors) {
      form.actions.clearErrors();
      showErrors(props.validationErrors);
    }
  }, [props.validationErrors]);

  const hasPreviewData = form.values.type === "kpi";
  const activeTab = hasPreviewData ? tab : "template";

  React.useEffect(() => {
    const field = Object.keys(form.errors).find((path) => path !== "base");
    if (field) setTab(field === "preview_data" || field.startsWith("preview_data.") ? "example-data" : "template");
  }, [form.errors]);

  function showNativeValidation(event: React.FormEvent<HTMLDivElement>) {
    // Hidden fields cannot receive browser focus. Surface their errors through the form instead.
    event.preventDefault();
    const invalidFields = event.currentTarget.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input:invalid, textarea:invalid",
    );
    form.actions.clearErrors();
    form.actions.addErrors(
      Object.fromEntries(Array.from(invalidFields, (field) => [field.name, field.validationMessage])),
    );
  }

  function generateSlug() {
    if (props.template || slugEdited.current) return;

    const slug = form.values.title
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200)
      .replace(/-$/, "");
    form.actions.setValue("slug", slug);
  }

  function input(): TemplateInput {
    const { title, slug, type, summary, category, content_language, definition, preview_data } = form.values;
    return {
      title,
      slug,
      type,
      summary,
      category,
      contentLanguage: content_language,
      definition: serializeDefinition(type, { ...definition, name: title }),
      previewData: type === "kpi" ? serializePreviewData(preview_data) : "{}",
    };
  }
  function showErrors(errors: TemplateValidationError[]) {
    form.actions.addErrors(
      Object.fromEntries(errors.map(({ path, message }) => [path === "definition.name" ? "title" : path, message])),
    );
  }

  return (
    <Forms.Form form={form} testId="curated-template-form">
      {hasPreviewData && (
        <div className="mb-6">
          <Tabs
            tabs={{
              active: activeTab,
              tabs: [
                { id: "template", label: t("Template"), icon: null, testId: "template" },
                { id: "example-data", label: t("Example data"), icon: null, testId: "example-data" },
              ],
            }}
            onChange={(next) => {
              if (form.state === "idle") setTab(next);
            }}
          />
        </div>
      )}
      <div onInvalidCapture={showNativeValidation}>
        <div hidden={activeTab !== "template"}>
          <Forms.FieldGroup>
            <Forms.TextInput
              field="title"
              label={t("Title", { context: "resource" })}
              required
              autoFocus
              onBlur={generateSlug}
            />
            <Forms.TextInput
              field="slug"
              label={t("Slug")}
              required
              maxLength={200}
              onChange={() => {
                slugEdited.current = true;
              }}
            />
            {props.template?.state === "published" ? (
              <p>{t("Published changes take effect immediately.")}</p>
            ) : (
              <Forms.SelectBox
                field="type"
                label={t("Type")}
                options={[
                  { value: "kpi", label: t("KPI") },
                  { value: "goal", label: t("Goal") },
                  { value: "project", label: t("Project") },
                ]}
              />
            )}
            <Forms.SelectBox
              field="content_language"
              label={t("Content language")}
              options={[
                { value: "en", label: "English" },
                { value: "pt-BR", label: "Português (Brasil)" },
              ]}
            />
            <DefinitionFields type={form.values.type} definition={form.values.definition} />
          </Forms.FieldGroup>
        </div>
        {hasPreviewData && (
          <div hidden={activeTab !== "example-data"}>
            <Forms.FieldGroup>
              <PreviewDataFields preview={form.values.preview_data} />
            </Forms.FieldGroup>
          </div>
        )}
      </div>
      {form.hasErrors && (
        <div role="alert" className="mt-4 text-content-error" data-test-id="template-errors">
          {Object.entries(form.errors).map(([path, message]) => (
            <Forms.ErrorMessage key={path} error={message} />
          ))}
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <PrimaryButton
          type="submit"
          size="sm"
          testId={published ? "update-template" : "publish-template"}
          loading={form.state === "submitting" && saveIntent === "publish"}
          disabled={form.state !== "idle"}
        >
          {published ? t("Update") : t("Publish")}
        </PrimaryButton>
        {!published && (
          <SecondaryButton
            type="button"
            size="sm"
            testId="save-template-draft"
            loading={form.state === "submitting" && saveIntent === "draft"}
            disabled={form.state !== "idle"}
            onClick={() => form.actions.submit("draft")}
          >
            {t("Save draft")}
          </SecondaryButton>
        )}
        <DimmedActionLink onClick={props.onCancel} disabled={form.state !== "idle"} testId="cancel-template">
          {t("Cancel")}
        </DimmedActionLink>
      </div>
    </Forms.Form>
  );
}

function serializePreviewData(preview: TemplatePreviewData): string {
  return JSON.stringify({
    entries: (preview.entries ?? []).map(({ period_offset, value }) => ({
      period_offset: numeric(period_offset),
      value: numeric(value),
    })),
    annotations: (preview.annotations ?? []).map(({ period_offset, title }) => ({
      period_offset: numeric(period_offset),
      title,
    })),
  });
}
