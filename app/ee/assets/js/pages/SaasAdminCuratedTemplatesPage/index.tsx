import React from "react";
import { useTranslation } from "react-i18next";
import { CuratedTemplatesCatalogPage } from "turboui";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { curatedTemplatesPath, curatedTemplatePath, curatedTemplatePreviewPath } from "@/ee/models/curatedTemplateLifecycle";
import { useLoadedData } from "./loader";
export { loader } from "./loader";

export function Page() {
  const { t } = useTranslation();
  const { templates } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <Pages.Page title={t("Curated templates")} testId="saas-admin-curated-templates-page">
      <CuratedTemplatesCatalogPage
        templates={templates}
        createPath={`${curatedTemplatesPath}/new`}
        administrationPath="/admin"
        templatePath={(template) => curatedTemplatePath(template.id)}
        previewPath={(template) => curatedTemplatePreviewPath(template.id)}
        formattedTimePreferences={formattedTimePreferences}
      />
    </Pages.Page>
  );
}
