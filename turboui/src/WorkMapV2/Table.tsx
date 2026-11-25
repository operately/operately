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
import type { WorkMapColumn } from "../ApiTypes";
import type { VisibleRow, WorkMapV2Item } from "./filterWorkMap";

export function columnLabels(t: (key: string) => string) {
  return {
    name: t("Name"),
    status: t("Status"),
    progress: t("Progress"),
    due_date: t("Due date"),
    space: t("Space"),
    champion: t("Champion"),
    reviewer: t("Reviewer"),
    next_step: t("Next step"),
  };
}

export function Table({
  rows,
  columns,
  onToggle,
  formattedTimePreferences,
}: {
  rows: VisibleRow[];
  columns: WorkMapColumn[];
  onToggle: (id: string) => void;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  const { t } = useTranslation();
  const labels = columnLabels(t);
  const widths = {
    name: "30.5%",
    status: "124px",
    progress: "8%",
    due_date: "8.3%",
    space: "9.9%",
    champion: "10%",
    reviewer: "10%",
    next_step: "auto",
  };
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full table-fixed border-collapse text-left text-sm"
        style={{ minWidth: Math.min(960, 240 + columns.length * 105) }}
      >
        <colgroup>
          {columns.map((c) => (
            <col key={c} style={{ width: widths[c] }} />
          ))}
        </colgroup>
        <thead className="h-9 border-b border-surface-outline bg-surface-dimmed text-xs text-content-dimmed">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-3 font-medium first:pl-7">
                {labels[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.item.id}
              className={`h-[46px] border-b border-surface-outline ${row.contextOnly ? "bg-surface-dimmed text-content-dimmed" : ""}`}
            >
              <th
                scope="row"
                colSpan={row.contextOnly ? columns.length : 1}
                className="px-3 pl-7 text-left font-normal"
              >
                <RowName row={row} onToggle={onToggle} />
              </th>
              {!row.contextOnly &&
                columns
                  .filter((c) => c !== "name")
                  .map((column) => (
                    <Detail key={column} column={column} item={row.item} preferences={formattedTimePreferences} />
                  ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RowName({ row, onToggle }: { row: VisibleRow; onToggle: (id: string) => void }) {
  const { t } = useTranslation();
  const { item, children, contextOnly, expanded, depth } = row;
  const ItemIcon = item.type === "goal" ? IconGoal : IconProject;
  const Chevron = expanded ? IconChevronDown : IconChevronRight;
  return (
    <div className="flex min-w-0 items-center gap-2" style={{ paddingInlineStart: depth * 25 }}>
      {children.length ? (
        <UnstyledButton
          className="flex h-7 w-4 shrink-0 items-center justify-center rounded"
          aria-expanded={expanded}
          ariaLabel={expanded ? t("Collapse {{name}}", { name: item.name }) : t("Expand {{name}}", { name: item.name })}
          onClick={() => onToggle(item.id)}
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
  );
}

function Detail({
  column,
  item,
  preferences,
}: {
  column: WorkMapColumn;
  item: WorkMapV2Item;
  preferences: FormattedTimePreferences;
}) {
  const dueDate = item.timeframe?.contextualEndDate;
  const calendarDate = parseDate(dueDate?.date);
  const status =
    item.type === "project" && item.state === "closed" && item.status === "achieved" ? "completed" : item.status;
  switch (column) {
    case "status":
      return (
        <td className="px-3">
          <StatusBadge status={status} />
        </td>
      );
    case "progress":
      return (
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
      );
    case "due_date":
      return (
        <td className="px-3 text-xs">
          <DateDisplay
            date={dueDate && calendarDate ? { ...dueDate, date: calendarDate } : null}
            locale={preferences.locale}
            placeholder="—"
          />
        </td>
      );
    case "space":
      return (
        <td className="truncate px-3 text-xs">
          {item.space && item.spacePath ? (
            <BlackLink to={item.spacePath} underline="hover">
              {item.space.name}
            </BlackLink>
          ) : (
            (item.space?.name ?? "—")
          )}
        </td>
      );
    case "reviewer":
    case "champion": {
      const person = column === "reviewer" ? item.reviewer : item.owner;
      const path = column === "reviewer" ? item.reviewerPath : item.ownerPath;
      return (
        <td className="px-3">
          {person ? <AvatarWithName person={person} link={path ?? undefined} size="tiny" nameFormat="short" /> : "—"}
        </td>
      );
    }
    case "next_step":
      return (
        <td className="truncate px-3 text-xs" title={item.nextStep}>
          {item.nextStep || "—"}
        </td>
      );
    default:
      return null;
  }
}
