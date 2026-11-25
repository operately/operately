import React from "react";
import { useTranslation } from "react-i18next";
import { AvatarWithName } from "../Avatar/AvatarWithName";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { DateDisplay } from "../DateField";
import { parseDate } from "../utils/time";
import type { FormattedTimePreferences } from "../FormattedTime";
import { IconChevronDown, IconChevronRight, IconGoal, IconProject } from "../icons";
import { BlackLink } from "../Link";
import { ProgressBar } from "../ProgressBar";
import { StatusBadge } from "../StatusBadge";
import { formatNumber } from "../utils/formatting";
import type { WorkMapRow, WorkMapV2Item } from "./filterWorkMap";

export function Table({
  rows,
  formattedTimePreferences,
}: {
  rows: WorkMapRow[];
  formattedTimePreferences: FormattedTimePreferences;
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  function toggle(id: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderRows(rows: WorkMapRow[], depth: number): React.ReactNode {
    return rows.map((row) => {
      const expanded = !collapsed.has(row.item.id);
      return (
        <React.Fragment key={row.item.id}>
          <Row
            row={row}
            depth={depth}
            expanded={expanded}
            onToggle={() => toggle(row.item.id)}
            preferences={formattedTimePreferences}
          />
          {expanded && renderRows(row.children, depth + 1)}
        </React.Fragment>
      );
    });
  }

  const headers = [t("Name"), t("Status"), t("Progress"), t("Due date"), t("Space"), t("Champion"), t("Next step")];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-sm">
        <colgroup>
          {["30.5%", "124px", "8%", "8.3%", "9.9%", "10%", "auto"].map((width) => (
            <col key={width} style={{ width }} />
          ))}
        </colgroup>
        <thead className="h-9 border-b border-surface-outline bg-surface-dimmed text-xs text-content-dimmed">
          <tr>
            {headers.map((label) => (
              <th key={label} scope="col" className="px-3 font-medium first:pl-7">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderRows(rows, 0)}</tbody>
      </table>
    </div>
  );
}

function Row({
  row,
  depth,
  expanded,
  onToggle,
  preferences,
}: {
  row: WorkMapRow;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  preferences: FormattedTimePreferences;
}) {
  const { t } = useTranslation();
  const { item, children, contextOnly } = row;
  const ItemIcon = item.type === "goal" ? IconGoal : IconProject;
  const Chevron = expanded ? IconChevronDown : IconChevronRight;
  return (
    <tr
      className={`h-[46px] border-b border-surface-outline ${contextOnly ? "bg-surface-dimmed text-content-dimmed" : ""}`}
    >
      <th scope="row" colSpan={contextOnly ? 7 : 1} className="px-3 pl-7 text-left font-normal">
        <div className="flex min-w-0 items-center gap-2" style={{ paddingInlineStart: depth * 25 }}>
          {children.length ? (
            <UnstyledButton
              className="flex h-7 w-4 shrink-0 items-center justify-center rounded"
              aria-expanded={expanded}
              ariaLabel={
                expanded ? t("Collapse {{name}}", { name: item.name }) : t("Expand {{name}}", { name: item.name })
              }
              onClick={onToggle}
            >
              <Chevron size={14} />
            </UnstyledButton>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <ItemIcon size={23} className="shrink-0" />
          <BlackLink
            to={item.itemPath}
            underline="hover"
            title={item.name}
            className={`truncate ${item.type === "goal" ? "font-semibold" : ""}`}
          >
            {item.name}
          </BlackLink>
          {contextOnly && <span className="shrink-0 text-[11px] text-content-dimmed">{t("Parent goal")}</span>}
        </div>
      </th>
      {!contextOnly && <Details item={item} preferences={preferences} />}
    </tr>
  );
}

function Details({ item, preferences }: { item: WorkMapV2Item; preferences: FormattedTimePreferences }) {
  const dueDate = item.timeframe?.contextualEndDate;
  const calendarDate = parseDate(dueDate?.date);
  const status =
    item.type === "project" && item.state === "closed" && item.status === "achieved" ? "completed" : item.status;
  return (
    <>
      <td className="px-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-3">
        {item.progress === null ? (
          "—"
        ) : (
          <div className="flex max-w-24 items-center gap-1.5 text-xs">
            <ProgressBar
              progress={item.progress}
              status={item.status === "outdated" ? undefined : item.status}
              size="sm"
            />
            {formatNumber(item.progress / 100, preferences.locale, { style: "percent" })}
          </div>
        )}
      </td>
      <td className="px-3 text-xs">
        <DateDisplay
          date={dueDate && calendarDate ? { ...dueDate, date: calendarDate } : null}
          locale={preferences.locale}
          placeholder="—"
        />
      </td>
      <td className="truncate px-3 text-xs">
        {item.space && item.spacePath ? (
          <BlackLink to={item.spacePath} underline="hover">
            {item.space.name}
          </BlackLink>
        ) : (
          (item.space?.name ?? "—")
        )}
      </td>
      <td className="px-3">
        {item.owner ? (
          <AvatarWithName person={item.owner} link={item.ownerPath ?? undefined} size="tiny" nameFormat="short" />
        ) : (
          "—"
        )}
      </td>
      <td className="truncate px-3 text-xs" title={item.nextStep}>
        {item.nextStep || "—"}
      </td>
    </>
  );
}
