import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CuratedTemplateDetailPage, CuratedTemplate, TemplateInput, TemplateSaveIntent } from "turboui";
import * as Pages from "@/components/Pages";
import { useLoadedData } from "./loader";
import {
  curatedTemplatesPath,
  curatedTemplatePath,
  useSaveCuratedTemplate,
  useDeleteCuratedTemplate,
} from "@/ee/models/curatedTemplateLifecycle";
export { loader } from "./loader";

export function Page() {
  const { template } = useLoadedData();
  const identity = template?.id.split("-").at(-1) ?? "new";
  return <TemplatePage key={identity} initialTemplate={template} />;
}

function TemplatePage({ initialTemplate }: { initialTemplate?: CuratedTemplate }) {
  const { t } = useTranslation();

  // Background refetches must not discard edits or replace the expected timestamp.
  const [template, setTemplate] = React.useState(initialTemplate);
  const navigate = useNavigate();
  const { save: saveTemplate, getIdentity } = useSaveCuratedTemplate(template);
  const remove = useDeleteCuratedTemplate();

  async function save(input: TemplateInput, intent: TemplateSaveIntent) {
    const result = await saveTemplate(input, intent);
    if (result.template) {
      setTemplate(result.template);
      navigate(curatedTemplatePath(result.template.id), { replace: true });
    }
    return result;
  }

  return (
    <Pages.Page title={template?.title ?? t("Create template")} testId="saas-admin-curated-template-page">
      <CuratedTemplateDetailPage
        template={template}
        catalogPath={curatedTemplatesPath}
        onCancel={() => navigate(curatedTemplatesPath)}
        onSave={save}
        onDelete={async () => {
          await remove.mutateAsync(getIdentity());
          navigate(curatedTemplatesPath);
        }}
      />
    </Pages.Page>
  );
}
