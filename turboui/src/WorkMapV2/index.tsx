import React from "react";
import { useTranslation } from "react-i18next";
import { PrimaryButton, SecondaryButton } from "../Button";
import type { FormattedTimePreferences } from "../FormattedTime";
import { tn } from "../i18n";
import { IconChevronRight, IconPlus } from "../icons";
import { BlackLink } from "../Link";
import { PageNew } from "../Page";
import { filterWorkMap, type WorkMapV2Filters, type WorkMapV2Item } from "./filterWorkMap";
import { EmptyWork } from "./EmptyWork";
import { Table } from "./Table";
import { Toolbar } from "./Toolbar";

export { defaultWorkMapV2Filters, type WorkMapV2Filters, type WorkMapV2Item } from "./filterWorkMap";

export interface WorkMapV2PageProps {
  title: string;
  space?: { name: string; href: string };
  onAddProject?: () => void;
  onAddGoal?: () => void;
  items: WorkMapV2Item[];
  filters: WorkMapV2Filters;
  onFiltersChange: (filters: WorkMapV2Filters) => void;
  formattedTimePreferences: FormattedTimePreferences;
}

export function WorkMapV2Page({
  title,
  space,
  onAddProject,
  onAddGoal,
  items,
  filters,
  onFiltersChange,
  formattedTimePreferences,
}: WorkMapV2PageProps) {
  const { t } = useTranslation();
  const { rows, counts, hasContext } = React.useMemo(() => filterWorkMap(items, filters), [items, filters]);
  const onlyType = filters.workTypes.length === 1 ? filters.workTypes[0] : undefined;
  const summary =
    onlyType === "project"
      ? tn("1 matching project", "{{count}} matching projects", counts.project)
      : onlyType === "goal"
        ? tn("1 matching goal", "{{count}} matching goals", counts.goal)
        : [tn("1 goal", "{{count}} goals", counts.goal), tn("1 project", "{{count}} projects", counts.project)].join(
            " · ",
          );

  return (
    <PageNew title={title} size="fullwidth" className="dark:bg-[#202126] dark:text-[#f0f0f3]">
      <header className="flex min-h-[78px] items-center justify-between gap-4 px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          {space && (
            <>
              <BlackLink to={space.href} underline="hover" className="truncate text-lg font-semibold dark:text-[#c2c4cd]">
                {space.name}
              </BlackLink>
              <IconChevronRight size={16} className="shrink-0 text-content-dimmed" />
            </>
          )}
          <h1 className="shrink-0 text-2xl font-semibold tracking-tight">{space ? t("Work Map") : title}</h1>
        </div>
        {items.length > 0 && (
          <PrimaryButton size="sm" icon={IconPlus} disabled>
            {t("Add work")}
          </PrimaryButton>
        )}
      </header>
      {items.length > 0 && <Toolbar filters={filters} onFiltersChange={onFiltersChange} />}
      {!items.length ? (
        <EmptyWork onAddProject={onAddProject} onAddGoal={onAddGoal} />
      ) : rows.length > 0 ? (
        <>
          <Table key={JSON.stringify(filters)} rows={rows} formattedTimePreferences={formattedTimePreferences} />
          <footer
            role="status"
            className="flex flex-wrap justify-between gap-2 px-4 py-4 text-xs text-content-dimmed sm:px-7"
          >
            {summary}
            {hasContext && <span>{t("Parent goals shown for context")}</span>}
          </footer>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          <h2 className="text-lg font-semibold">
            {onlyType === "project" ? t("No projects match these filters") : t("No matching work.")}
          </h2>
          <p className="text-sm text-content-dimmed">{t("Try another filter or clear them to see more work.")}</p>
          <SecondaryButton size="sm" onClick={() => onFiltersChange({ workTypes: [], lifecycle: [] })}>
            {t("Clear filters")}
          </SecondaryButton>
        </div>
      )}
    </PageNew>
  );
}
