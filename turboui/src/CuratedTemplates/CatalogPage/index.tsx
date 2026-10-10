import React from "react";
import { useTranslation } from "react-i18next";
import { Tabs } from "../../Tabs";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { Page } from "../../Page";
import { Link } from "../../Link";
import { FormattedTime, FormattedTimePreferences } from "../../FormattedTime";
import type { CuratedTemplate, TemplateType } from "../types";

export interface CuratedTemplatesCatalogProps {
  templates: CuratedTemplate[];
  createPath: string;
  administrationPath: string;
  templatePath: (template: CuratedTemplate) => string;
  formattedTimePreferences: FormattedTimePreferences;
}

export function CuratedTemplatesCatalogPage(props: CuratedTemplatesCatalogProps) {
  const { t } = useTranslation();
  const typeLabel = { project: t("Projects"), goal: t("Goals"), kpi: t("KPIs") };
  const [selection, setSelection] = React.useState<{ type: TemplateType; offset: number }>({
    type: "project",
    offset: 0,
  });
  const filtered = props.templates.filter((template) => template.type === selection.type);
  const templates = filtered.slice(selection.offset, selection.offset + 20);
  const showPagination = selection.offset > 0 || filtered.length > 20;

  return (
    <Page
      title={t("Curated templates")}
      size="xlarge"
      navigation={[{ to: props.administrationPath, label: t("Administration") }]}
      testId="curated-template-catalog"
    >
      <div className="px-4 py-8 sm:px-12 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-extrabold text-content-accent md:text-2xl">{t("Curated templates")}</h1>
          <PrimaryButton size="sm" linkTo={props.createPath} testId="create-template">
            {t("Create template")}
          </PrimaryButton>
        </div>
        <Tabs
          onChange={(type) => {
            if (type === "project" || type === "goal" || type === "kpi") setSelection({ type, offset: 0 });
          }}
          tabs={{
            active: selection.type,
            tabs: (["project", "goal", "kpi"] as const).map((type) => ({
              id: type,
              label: typeLabel[type],
              icon: null,
              testId: type,
            })),
          }}
        />
        <div className="divide-y divide-surface-outline">
          {templates.length === 0 && (
            <div className="py-12 text-center" data-test-id="catalog-empty">
              <p className="text-lg text-content-accent">{t("No templates in this tab yet.")}</p>
              <p className="mt-2 text-sm text-content-dimmed">
                {t("Create a reusable template for a KPI, goal, or project.")}
              </p>
            </div>
          )}
          {templates.map((template) => (
            <div key={template.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <Link to={props.templatePath(template)} className="font-semibold">
                  {template.title}
                </Link>
                <p className="text-sm text-content-subtle">
                  {template.state === "draft" ? t("Draft") : t("Published")}
                </p>
              </div>
              <FormattedTime {...props.formattedTimePreferences} time={template.updatedAt} format="long-date" />
            </div>
          ))}
        </div>
        {showPagination && (
          <div className="mt-6 flex justify-end gap-3" data-test-id="catalog-pagination">
            <SecondaryButton
              size="sm"
              testId="previous-template-page"
              disabled={selection.offset === 0}
              onClick={() => setSelection({ ...selection, offset: Math.max(0, selection.offset - 20) })}
            >
              {t("Previous")}
            </SecondaryButton>
            <SecondaryButton
              size="sm"
              testId="next-template-page"
              disabled={selection.offset + templates.length >= filtered.length}
              onClick={() => setSelection({ ...selection, offset: selection.offset + 20 })}
            >
              {t("Next")}
            </SecondaryButton>
          </div>
        )}
      </div>
    </Page>
  );
}
