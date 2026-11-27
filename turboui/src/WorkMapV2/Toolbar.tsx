import React from "react";
import { useTranslation } from "react-i18next";
import { SecondaryButton } from "../Button";
import { IconAdjustmentsHorizontal, IconDots, IconGripVertical, IconTable, IconTimeline } from "../icons";
import { Menu, MenuActionItem, MenuSeparator } from "../Menu";
import { ViewToggle } from "../ViewToggle";
import { FilterMenu } from "./FilterMenu";
import { CheckChoice, ChoiceGroup } from "./MenuChoices";
import { mapColumns, type WorkMapViewState, type WorkMapV2Item } from "./filterWorkMap";
import { columnLabels, useTableLayout } from "./Table";
import type { WorkMapSort } from "../ApiTypes";

interface Props {
  view: WorkMapViewState;
  items: WorkMapV2Item[];
  onChange: (view: WorkMapViewState) => void;
  onReset: () => void;
  onOrganize?: () => void;
  onSave?: () => void;
  saving?: boolean;
  adjusted: boolean;
  scopeName: string;
  spaceId?: string;
}
export function Toolbar({
  view,
  items,
  onChange,
  onReset,
  onSave,
  onOrganize,
  saving,
  adjusted,
  scopeName,
  spaceId,
}: Props) {
  const { t } = useTranslation();
  const labels = columnLabels(t);
  const { phone, visibleColumns } = useTableLayout(view.columns);
  const resetButton = adjusted && view.filters.length > 0 && (
    <SecondaryButton size="xs" onClick={onReset} testId="work-map-reset-view">
      {t("Reset view")}
    </SecondaryButton>
  );
  const sorts: Record<WorkMapSort, string> = {
    map_order: t("Map order"),
    name: t("Name"),
    due_date: t("Due date"),
    status: t("Status"),
    progress: t("Progress"),
  };
  return (
    <div
      className={`min-h-[57px] items-center gap-2 border-y border-surface-outline px-4 py-2 sm:px-7 ${phone ? "grid grid-cols-[auto_1fr_auto]" : "flex flex-wrap"}`}
    >
      <ViewToggle
        value={view.view}
        ariaLabel={t("Work map view")}
        options={[
          {
            value: "table",
            label: t("Table"),
            icon: !phone && <IconTable size={14} />,
            onSelect: () => onChange({ ...view, view: "table" }),
          },
          {
            value: "timeline",
            testId: "work-map-timeline",
            label: t("Timeline"),
            icon: !phone && <IconTimeline size={14} />,
            onSelect: () => onChange({ ...view, view: "timeline" }),
          },
        ]}
      />
      {!phone && <span aria-hidden className="mx-1 h-5 border-l border-surface-outline" />}
      <FilterMenu
        compact={phone}
        spaceId={spaceId}
        items={items}
        filters={view.filters}
        onChange={(filters) => onChange({ ...view, filters })}
      />
      <div className={phone ? "flex items-center" : "ml-auto flex items-center gap-2"}>
        {!phone && resetButton}
        <Menu
          testId="work-map-display"
          triggerLabel={phone ? undefined : t("Display")}
          ariaLabel={phone ? t("Actions") : undefined}
          triggerIcon={phone ? IconDots : IconAdjustmentsHorizontal}
          triggerClassName={phone ? "min-h-10 min-w-10 flex items-center justify-center" : undefined}
          align="end"
          size="small"
        >
          {phone && onOrganize && (
            <MenuActionItem testId="work-map-organize" icon={IconGripVertical} onClick={onOrganize}>
              {t("Organize")}
            </MenuActionItem>
          )}
          <ChoiceGroup label={t("Sort within each goal")} valueLabel={sorts[view.sort]}>
            {(Object.keys(sorts) as WorkMapSort[]).map((sort) => (
              <CheckChoice
                key={sort}
                checked={view.sort === sort}
                label={sorts[sort]}
                onChange={() => onChange({ ...view, sort })}
              />
            ))}
          </ChoiceGroup>
          {!phone && (
            <ChoiceGroup label={t("Columns")} valueLabel={t("{{count}} shown", { count: visibleColumns.length })}>
              {mapColumns.map((column) => (
                <CheckChoice
                  key={column}
                  label={labels[column]}
                  checked={view.columns.includes(column)}
                  onChange={
                    column === "name"
                      ? undefined
                      : () =>
                          onChange({
                            ...view,
                            columns: mapColumns.filter((c) =>
                              c === column ? !view.columns.includes(c) : view.columns.includes(c),
                            ),
                          })
                  }
                />
              ))}
            </ChoiceGroup>
          )}
          <CheckChoice
            label={t("Show KPIs")}
            checked={view.showKpis}
            onChange={() => onChange({ ...view, showKpis: !view.showKpis })}
          />
          <MenuSeparator />
          {onSave && (
            <MenuActionItem testId="work-map-save-default" disabled={saving} onClick={onSave}>
              {t("Set default view for {{name}}", { name: scopeName })}
            </MenuActionItem>
          )}
          <MenuActionItem onClick={onReset} disabled={!adjusted}>
            {spaceId ? t("Reset to space default") : t("Reset to company default")}
          </MenuActionItem>
        </Menu>
        {!phone && onOrganize && (
          <SecondaryButton testId="work-map-organize" size="xs" onClick={onOrganize} icon={IconGripVertical}>
            {t("Organize")}
          </SecondaryButton>
        )}
      </div>
      {phone && resetButton && <div className="col-span-full justify-self-end">{resetButton}</div>}
    </div>
  );
}
