import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../../Forms";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { DimmedActionLink } from "../../Link";
import { readDefinition, serializeDefinition } from "./definition";
import { DefinitionFields } from "./DefinitionFields";
import type { TemplateDefinition, TemplateInput, TemplateType, TemplateValidationError } from "../types";
import type { TemplateEditorProps } from "./types";

class ValidationFailure extends Error {
  constructor(public errors: TemplateValidationError[]) {
    super("Template validation failed");
  }
}

export function TemplateEditor(props: TemplateEditorProps) {
  const { t } = useTranslation();
  const initial = React.useMemo(
    () => ({
      title: props.template?.title ?? "",
      type: props.template?.type ?? ("kpi" as TemplateType),
      summary: props.template?.summary ?? "",
      category: props.template?.category ?? "",
      content_language: props.template?.contentLanguage ?? "en",
      definition: props.template ? readDefinition(props.template.definition) : ({} as TemplateDefinition),
    }),
    [props.template],
  );
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
  function input(): TemplateInput {
    const { title, type, summary, category, content_language, definition } = form.values;
    return {
      title,
      type,
      summary,
      category,
      contentLanguage: content_language,
      definition: serializeDefinition(type, { ...definition, name: title }),
    };
  }
  function showErrors(errors: TemplateValidationError[]) {
    form.actions.addErrors(
      Object.fromEntries(errors.map(({ path, message }) => [path === "definition.name" ? "title" : path, message])),
    );
  }

  return (
    <Forms.Form form={form} testId="curated-template-form">
      <Forms.FieldGroup>
        <Forms.TextInput field="title" label={t("Title", { context: "resource" })} required autoFocus />
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
      {form.hasErrors && (
        <div role="alert" className="mt-4 text-content-error" data-test-id="template-errors">
          {Object.entries(form.errors).map(([path, message]) => (
            <p key={path}>{message}</p>
          ))}
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <PrimaryButton
          type="submit"
          size="sm"
          testId={published ? "submit" : "publish-template"}
          loading={form.state === "submitting" && saveIntent === "publish"}
          disabled={form.state !== "idle"}
        >
          {published ? t("Update") : t("Publish")}
        </PrimaryButton>
        {!published && (
          <SecondaryButton
            type="button"
            size="sm"
            testId="submit"
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
