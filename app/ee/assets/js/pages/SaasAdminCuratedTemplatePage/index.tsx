import React from "react";
import { useMatch, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CuratedTemplateDetailPage, CuratedTemplate, TemplateInput, TemplateSaveIntent } from "turboui";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useLoadedData } from "./loader";
import {
  curatedTemplatesPath,
  curatedTemplatePath,
  curatedTemplateEditPath,
  curatedTemplatePreviewPath,
  useSaveCuratedTemplate,
  useDeleteCuratedTemplate,
} from "@/ee/models/curatedTemplateLifecycle";
export { loader } from "./loader";

export function Page() {
  const { template } = useLoadedData();
  const editing = !!useMatch("/admin/curated-templates/:templateId/edit") || !template;
  const identity = template?.id.split("-").at(-1) ?? "new";
  return <TemplatePage key={`${identity}-${editing}`} initialTemplate={template} editing={editing} />;
}

function TemplatePage({ initialTemplate, editing }: { initialTemplate?: CuratedTemplate; editing: boolean }) {
  const { t } = useTranslation();
  const formattedTimePreferences = useFormattedTimePreferences();

  // Background refetches must not discard edits or replace the expected timestamp.
  const [editingTemplate, setTemplate] = React.useState(initialTemplate);
  const template = editing ? editingTemplate : initialTemplate;
  const navigate = useNavigate();
  const { save: saveTemplate, savePreviewData, getIdentity } = useSaveCuratedTemplate(template);
  const remove = useDeleteCuratedTemplate();

  async function save(input: TemplateInput, intent: TemplateSaveIntent) {
    const result = await saveTemplate(input, intent);
    if (result.template && result.errors.length === 0) {
      setTemplate(result.template);
      navigate(curatedTemplatePath(result.template.id), { replace: true });
    }
    return result;
  }

  return (
    <Pages.Page title={template?.title ?? t("Create template")} testId="saas-admin-curated-template-page">
      <CuratedTemplateDetailPage
        template={template}
        editing={editing}
        editPath={template ? curatedTemplateEditPath(template.id) : undefined}
        formattedTimePreferences={formattedTimePreferences}
        catalogPath={curatedTemplatesPath}
        previewPath={template ? curatedTemplatePreviewPath(template.id) : undefined}
        onCancel={() => navigate(template ? curatedTemplatePath(template.id) : curatedTemplatesPath)}
        onSave={save}
        onSavePreviewData={async (previewData) => {
          const result = await savePreviewData(previewData);
          if (result.template && result.errors.length === 0) {
            setTemplate(result.template);
            navigate(curatedTemplatePath(result.template.id), { replace: true });
          }
          return result;
        }}
        onDelete={async () => {
          await remove.mutateAsync(getIdentity());
          navigate(curatedTemplatesPath);
        }}
      />
    </Pages.Page>
  );
}
