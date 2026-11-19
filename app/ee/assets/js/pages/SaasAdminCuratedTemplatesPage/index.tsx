import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { CuratedTemplatesCatalogPage } from "turboui";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import {
  curatedTemplatesPath,
  curatedTemplatePath,
  curatedTemplatePreviewPath,
} from "@/ee/models/curatedTemplateLifecycle";
import { useLoadedData } from "./loader";
export { loader } from "./loader";
export { shouldRevalidate } from "./navigation";

export function Page() {
  const { t } = useTranslation();
  const { templates } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const selectedType = tab === "goal" || tab === "kpi" ? tab : "project";

  return (
    <Pages.Page title={t("Curated templates")} testId="saas-admin-curated-templates-page">
      <CuratedTemplatesCatalogPage
        templates={templates}
        selectedType={selectedType}
        onSelectedTypeChange={(type) => {
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.set("tab", type);
            return next;
          });
        }}
        createPath={`${curatedTemplatesPath}/new`}
        administrationPath="/admin"
        templatePath={(template) => curatedTemplatePath(template.id)}
        previewPath={(template) => curatedTemplatePreviewPath(template.id)}
        formattedTimePreferences={formattedTimePreferences}
      />
    </Pages.Page>
  );
}
