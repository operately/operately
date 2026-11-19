import React from "react";
import { useTranslation } from "react-i18next";
import { BlackLink } from "../../Link";
import type { FormattedTimePreferences } from "../../FormattedTime";
import { GoalPage } from "../../GoalPage";
import { ProjectPage } from "../../ProjectPage";
import { KpiDetail } from "../../SpaceKpisPage/KpiDetail";
import { KpiFormattingProvider } from "../../SpaceKpisPage/formatting";
import type { CuratedTemplate } from "../types";
import { buildPreview, richTextHandlers, unavailable } from "./adapters";

export interface CuratedTemplatePreviewProps {
  template: CuratedTemplate;
  templatePath: string;
  referenceDate: string;
  formattedTimePreferences: FormattedTimePreferences;
}

export function CuratedTemplatePreviewPage(props: CuratedTemplatePreviewProps) {
  const { t } = useTranslation();
  const preview = React.useMemo(
    () =>
      buildPreview(props.template, {
        referenceDate: props.referenceDate,
        formattedTimePreferences: props.formattedTimePreferences,
        labels: { missing: t("Not set"), pending: t("Pending", { context: "work status" }) },
      }),
    [props.template, props.referenceDate, props.formattedTimePreferences, t],
  );

  return (
    <div className="flex h-dvh flex-col bg-surface-base" data-test-id="template-preview">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-outline bg-surface-dimmed px-4 py-3 text-sm">
        <div>
          <div className="font-semibold">{t("Template preview")}</div>
          <div className="text-content-subtle">{t("Read-only preview of the last saved content.")}</div>
        </div>
        <BlackLink to={props.templatePath} testId="back-to-template">
          {t("Back to template")}
        </BlackLink>
      </header>
      {preview.incomplete && (
        <div
          className="border-b border-surface-outline px-4 py-2 text-sm text-content-subtle"
          data-test-id="preview-incomplete"
        >
          {t("Missing values appear as placeholders. Targets without a baseline or target value are omitted.")}
        </div>
      )}
      <main className="relative min-h-0 flex-1 overflow-auto">
        {preview.type === "project" && <ProjectPage {...preview.props} />}
        {preview.type === "goal" && <GoalPage {...preview.props} />}
        {preview.type === "kpi" && (
          <KpiFormattingProvider value={props.formattedTimePreferences}>
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
              <KpiDetail
                kpi={preview.kpi}
                fields={{ ...preview.kpi, cadence: preview.cadence, update: unavailable }}
                canManage={false}
                canComment={false}
                championSearch={async () => []}
                richTextHandlers={richTextHandlers}
                onDescriptionChange={unavailable}
                onLogUpdate={unavailable}
                onOpenNewAnnotation={unavailable}
                onOpenAnnotation={unavailable}
                onEditEntry={unavailable}
                onDeleteEntry={unavailable}
                onDelete={unavailable}
              />
            </div>
          </KpiFormattingProvider>
        )}
      </main>
    </div>
  );
}
