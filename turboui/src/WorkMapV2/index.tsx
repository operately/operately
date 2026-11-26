import React from "react";
import { useTranslation } from "react-i18next";
import { SecondaryButton } from "../Button";
import type { FormattedTimePreferences } from "../FormattedTime";
import { tn } from "../i18n";
import { IconChevronRight } from "../icons";
import { BlackLink } from "../Link";
import { PageNew } from "../Page";
import { filterWorkMap, visibleRows, type WorkMapViewState, type WorkMapV2Item } from "./filterWorkMap";
import { EmptyWork } from "./EmptyWork";
import { Timeline } from "./Timeline";
import { KpiStrip, type WorkMapKpiStrip } from "./KpiStrip";
import { Table } from "./Table";
import { Organize, type Organization } from "./Organize";
import { useAddWork, type WorkMapCreation } from "./AddWork";
import { Toolbar } from "./Toolbar";
import type { ReviewerEditing } from "./ReviewerField";

export { builtInWorkMapView, mapColumns, type WorkMapViewState, type WorkMapV2Item } from "./filterWorkMap";

export interface WorkMapV2PageProps {
  title: string;
  space?: { id: string; name: string; href: string };
  organization?: Organization;
  creation?: WorkMapCreation;
  kpis?: WorkMapKpiStrip;
  reviewerEditing?: ReviewerEditing;
  items: WorkMapV2Item[];
  view: WorkMapViewState;
  onViewChange: (view: WorkMapViewState) => void;
  onReset: () => void;
  adjusted: boolean;
  scopeName: string;
  orderedItemIds?: string[];
  onSaveDefault?: () => void;
  saving?: boolean;
  formattedTimePreferences: FormattedTimePreferences;
}

export function WorkMapV2Page({
  title,
  organization,
  creation,
  kpis,
  reviewerEditing,
  space,
  items,
  view,
  onViewChange,
  onReset,
  adjusted,
  scopeName,
  orderedItemIds,
  onSaveDefault,
  saving,
  formattedTimePreferences,
}: WorkMapV2PageProps) {
  const { t } = useTranslation();
  const addWork = useAddWork(creation, scopeName, space?.id);
  const [organizing, setOrganizing] = React.useState(false);
  const { locale, timezone } = formattedTimePreferences;
  const { rows, counts, hasContext, undated } = React.useMemo(
    () => filterWorkMap(items, view, orderedItemIds ?? [], locale, timezone, space?.id),
    [items, view, orderedItemIds, locale, timezone, space?.id],
  );
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const visible = React.useMemo(() => visibleRows(rows, collapsed), [rows, collapsed]);
  function toggle(id: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const typeFilter = view.filters.find((f) => f.field === "work_type" && f.operator !== "is_not");
  const onlyType = typeFilter?.values.length === 1 ? typeFilter.values[0] : undefined;
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
              <BlackLink
                to={space.href}
                underline="hover"
                className="truncate text-lg font-semibold dark:text-[#c2c4cd]"
              >
                {space.name}
              </BlackLink>
              <IconChevronRight size={16} className="shrink-0 text-content-dimmed" />
            </>
          )}
          <h1 className="shrink-0 text-2xl font-semibold tracking-tight">{space ? t("Work Map") : title}</h1>
        </div>
        {items.length > 0 && !organizing && addWork.menu}
      </header>

      {organizing && organization ? (
        <Organize
          initialRows={
            filterWorkMap(
              items,
              { ...view, sort: "map_order", filters: [] },
              orderedItemIds ?? [],
              locale,
              timezone,
              space?.id,
            ).rows
          }
          columns={view.columns}
          formattedTimePreferences={formattedTimePreferences}
          organization={organization}
          space={Boolean(space)}
          onClose={() => setOrganizing(false)}
        />
      ) : (
        <>
          {items.length > 0 && (
            <Toolbar
              items={items}
              view={view}
              onChange={onViewChange}
              onReset={onReset}
              adjusted={adjusted}
              scopeName={scopeName}
              spaceId={space?.id}
              onOrganize={organization ? () => setOrganizing(true) : undefined}
              onSave={onSaveDefault}
              saving={saving}
            />
          )}
          {view.showKpis && kpis && (
            <KpiStrip data={kpis} spaceName={space?.name} preferences={formattedTimePreferences} />
          )}
          {!items.length ? (
            addWork.onboarding || <EmptyWork onAddProject={addWork.addProject} onAddGoal={addWork.addGoal} />
          ) : rows.length > 0 ? (
            <>
              {view.view === "table" ? (
                <Table
                  reviewerEditing={reviewerEditing}
                  quickAdd={addWork.quickAdd}
                  rows={visible}
                  columns={view.columns}
                  onToggle={toggle}
                  formattedTimePreferences={formattedTimePreferences}
                />
              ) : (
                <Timeline
                  rows={visible}
                  onToggle={toggle}
                  scale={view.timelineScale}
                  onScale={(timelineScale) => onViewChange({ ...view, timelineScale })}
                  preferences={formattedTimePreferences}
                />
              )}
              <footer
                role="status"
                className="flex flex-wrap justify-between gap-2 px-4 py-4 text-xs text-content-dimmed sm:px-7"
              >
                {summary}
                {hasContext && <span>{t("Parent goals shown for context")}</span>}
                {view.view === "timeline" && (
                  <span>
                    {[
                      undated.goal > 0 && tn("1 goal without dates", "{{count}} goals without dates", undated.goal),
                      undated.project > 0 &&
                        tn("1 project without dates", "{{count}} projects without dates", undated.project),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </footer>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <h2 className="text-lg font-semibold">
                {onlyType === "project" ? t("No projects match these filters") : t("No matching work.")}
              </h2>
              <p className="text-sm text-content-dimmed">{t("Try another filter or clear them to see more work.")}</p>
              <SecondaryButton size="sm" onClick={() => onViewChange({ ...view, filters: [] })}>
                {t("Clear filters")}
              </SecondaryButton>
            </div>
          )}
        </>
      )}
      {addWork.dialogs}
    </PageNew>
  );
}
