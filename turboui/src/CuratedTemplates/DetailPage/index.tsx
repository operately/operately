import React from "react";
import { useTranslation } from "react-i18next";
import { Menu, MenuActionItem, MenuLinkItem } from "../../Menu";
import { ConfirmDialog } from "../../ConfirmDialog";
import { Page } from "../../Page";
import { ErrorMessage } from "../../Forms";
import { TemplateEditor } from "./TemplateEditor";
import { TemplateDetails } from "./TemplateDetails";
import type { TemplateValidationError } from "../types";
import type { TemplateDetailProps } from "./types";

export function CuratedTemplateDetailPage(props: TemplateDetailProps) {
  const { t } = useTranslation();
  const [action, setAction] = React.useState<"delete" | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<TemplateValidationError[]>([]);
  const template = props.template;
  const editing = !template || props.editing;

  async function run(callback: () => Promise<{ errors?: TemplateValidationError[] } | void>) {
    setBusy(true);
    setErrors([]);
    try {
      const result = await callback();
      setErrors(result?.errors ?? []);
      setAction(null);
    } catch {
      setErrors([
        {
          path: "base",
          message: t("The action could not be completed. Reload if another admin has changed the template."),
        },
      ]);
      setAction(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page
      title={template?.title ?? t("Create template")}
      size="medium"
      navigation={[{ to: props.catalogPath, label: t("Curated templates") }]}
      testId="curated-template-detail"
    >
      <div className="px-4 py-8 sm:px-12 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-content-accent md:text-2xl">
              {template?.title ?? t("Create template")}
            </h1>
            {template && (
              <p
                data-test-id="template-state"
                data-state={template.state}
                data-updated-at={template.updatedAt}
                className="text-content-subtle"
              >
                {template.state === "draft" ? t("Draft") : t("Published")}
              </p>
            )}
          </div>
          {template && (
            <Menu testId="template-actions" align="end" readonly={busy}>
              {!editing && props.editPath && (
                <MenuLinkItem to={props.editPath} testId="edit-template">
                  {t("Edit")}
                </MenuLinkItem>
              )}
              {props.previewPath && (
                <MenuLinkItem to={props.previewPath} target="_blank" testId="preview-template">
                  {t("Preview")}
                </MenuLinkItem>
              )}
              <MenuActionItem danger testId="delete-template" disabled={busy} onClick={() => setAction("delete")}>
                {t("Delete")}
              </MenuActionItem>
            </Menu>
          )}
        </div>
        {errors.length > 0 && (
          <div className="mb-6">
            {errors.map(({ path, message }) => (
              <ErrorMessage key={path} error={message} />
            ))}
          </div>
        )}
        <div className="max-w-3xl">
          {!editing && template ? (
            <TemplateDetails template={template} formattedTimePreferences={props.formattedTimePreferences} />
          ) : (
            <TemplateEditor
              {...props}
              onSave={async (input, intent) => {
                setErrors([]);
                setBusy(true);
                try {
                  return await props.onSave(input, intent);
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
        </div>
        <ConfirmDialog
          testId="template-action-confirmation"
          confirming={busy}
          isOpen={action !== null}
          title={t("Delete template")}
          message={t("This action cannot be undone.")}
          confirmText={t("Delete")}
          cancelText={t("Cancel")}
          onCancel={() => {
            if (!busy) setAction(null);
          }}
          onConfirm={async () => {
            if (!busy) await run(props.onDelete);
          }}
        />
      </div>
    </Page>
  );
}
