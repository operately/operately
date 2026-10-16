import React from "react";
import { useTranslation } from "react-i18next";
import { FormattedTime, FormattedTimePreferences } from "../../FormattedTime";
import RichContent from "../../RichContent";
import type { RichTextJSON } from "../../RichContent";
import { formatNumber } from "../../utils/formatting";
import type { CuratedTemplate, EditableNumber, TemplatePreviewData } from "../types";
import { readDefinition, numeric } from "./definition";

interface Props {
  template: CuratedTemplate;
  formattedTimePreferences: FormattedTimePreferences;
}

export function TemplateDetails({ template, formattedTimePreferences }: Props) {
  const { t } = useTranslation();
  const definition = readDefinition(template.definition);
  const typeLabel = { kpi: t("KPI"), goal: t("Goal"), project: t("Project") };
  const language =
    { en: "English", "pt-BR": "Português (Brasil)" }[template.contentLanguage] ?? template.contentLanguage;
  const formatValue = (value: EditableNumber | undefined) => {
    const parsed = numeric(value);
    return parsed === null ? t("Not set") : formatNumber(parsed, formattedTimePreferences.locale);
  };

  return (
    <div className="space-y-8" data-test-id="template-details">
      {template.summary && <p className="whitespace-pre-wrap text-content-subtle">{template.summary}</p>}
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <Detail label={t("Type")}>{typeLabel[template.type]}</Detail>
        <Detail label={t("Slug")}>{template.slug}</Detail>
        <Detail label={t("Content language")}>{language}</Detail>
        {template.category && <Detail label={t("Category")}>{template.category}</Detail>}
        {definition.name && definition.name !== template.title && <Detail label={t("Name")}>{definition.name}</Detail>}
        {template.type === "kpi" ? (
          <>
            <Detail label={t("Unit")}>{definition.unit}</Detail>
            <Detail label={t("Cadence")}>
              {definition.cadence === "weekly" ? t("Weekly") : definition.cadence === "monthly" ? t("Monthly") : null}
            </Detail>
          </>
        ) : (
          <Detail label={t("Duration in days")}>{formatValue(definition.duration_days)}</Detail>
        )}
      </dl>
      <Section title={t("Description")}>
        <Description content={definition.description} />
      </Section>
      {template.type === "goal" && (
        <Section title={t("Targets")}>
          {definition.targets?.length ? (
            <div className="space-y-4">
              {definition.targets.map((target, index) => (
                <div key={index} className="rounded-lg border border-surface-outline p-4">
                  <h3 className="mb-3 font-semibold">{target.name || t("Not set")}</h3>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Detail label={t("Unit")}>{target.unit}</Detail>
                    <Detail label={t("Baseline")}>{formatValue(target.from)}</Detail>
                    <Detail label={t("Target value")}>{formatValue(target.to)}</Detail>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <EmptyList />
          )}
        </Section>
      )}
      {template.type === "project" && (
        <>
          <Section title={t("Milestones")}>
            {definition.milestones?.length ? (
              <div className="space-y-4">
                {definition.milestones.map((milestone) => (
                  <div key={milestone.key} className="rounded-lg border border-surface-outline p-4">
                    <h3 className="mb-3 font-semibold">{milestone.title || t("Untitled milestone")}</h3>
                    <dl>
                      <Detail label={t("Days after start")}>{formatValue(milestone.due_offset_days)}</Detail>
                    </dl>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyList />
            )}
          </Section>
          <Section title={t("Tasks")}>
            {definition.tasks?.length ? (
              <div className="space-y-4">
                {definition.tasks.map((task) => (
                  <div key={task.key} className="space-y-4 rounded-lg border border-surface-outline p-4">
                    <h3 className="font-semibold">{task.name || t("Not set")}</h3>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Detail label={t("Milestone")}>
                        {task.milestone_key
                          ? definition.milestones?.find((milestone) => milestone.key === task.milestone_key)?.title ||
                            t("Untitled milestone")
                          : t("Project level")}
                      </Detail>
                      <Detail label={t("Days after start")}>{formatValue(task.due_offset_days)}</Detail>
                    </dl>
                    {task.description && <Description content={task.description} />}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyList />
            )}
          </Section>
        </>
      )}
      {template.type === "kpi" && <ExampleData template={template} formatValue={formatValue} />}
      <dl className="grid grid-cols-1 gap-5 border-t border-surface-outline pt-6 sm:grid-cols-3">
        <Detail label={t("Created")}>
          <FormattedTime {...formattedTimePreferences} time={template.insertedAt} format="long-date" />
        </Detail>
        <Detail label={t("Last update")}>
          <FormattedTime {...formattedTimePreferences} time={template.updatedAt} format="long-date" />
        </Detail>
        {template.publishedAt && (
          <Detail label={t("Published")}>
            <FormattedTime {...formattedTimePreferences} time={template.publishedAt} format="long-date" />
          </Detail>
        )}
      </dl>
    </div>
  );
}

function ExampleData({
  template,
  formatValue,
}: {
  template: CuratedTemplate;
  formatValue: (value: EditableNumber | undefined) => string;
}) {
  const { t } = useTranslation();
  const preview: TemplatePreviewData = JSON.parse(template.previewData ?? "{}");
  return (
    <Section title={t("Example data")}>
      <div className="space-y-6" data-test-id="template-example-data">
        {preview.entries?.length ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-outline">
                <th scope="col" className="pb-3 font-semibold">
                  {t("Period offset")}
                </th>
                <th scope="col" className="pb-3 text-right font-semibold">
                  {t("Value")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-outline">
              {preview.entries.map((entry, index) => (
                <tr key={index}>
                  <td className="py-3">{formatValue(entry.period_offset)}</td>
                  <td className="py-3 text-right tabular-nums">{formatValue(entry.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyList />
        )}
        <div>
          <h3 className="mb-3 font-semibold">{t("Annotations")}</h3>
          {preview.annotations?.length ? (
            <ul className="space-y-3">
              {preview.annotations.map((annotation, index) => (
                <li key={index} className="rounded-lg border border-surface-outline p-4">
                  <p className="mb-2 font-medium">{annotation.title}</p>
                  <dl>
                    <Detail label={t("Period offset")}>{formatValue(annotation.period_offset)}</Detail>
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyList />
          )}
        </div>
      </div>
    </Section>
  );
}

function Detail({ label, children }: React.PropsWithChildren<{ label: string }>) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-sm text-content-subtle">{label}</dt>
      <dd className="break-words text-content-accent">{children || t("Not set")}</dd>
    </div>
  );
}

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="border-t border-surface-outline pt-6">
      <h2 className="mb-4 font-bold text-content-accent">{title}</h2>
      {children}
    </section>
  );
}

function Description({ content }: { content?: RichTextJSON | null }) {
  const { t } = useTranslation();
  return content ? (
    <RichContent content={content} mentionedPersonLookup={async () => null} taskList={{ canEdit: false }} />
  ) : (
    <p className="text-sm text-content-subtle">{t("Not set")}</p>
  );
}

function EmptyList() {
  const { t } = useTranslation();
  return <p className="text-sm text-content-subtle">{t("None")}</p>;
}
