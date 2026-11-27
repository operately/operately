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
import { useWindowSizeBreakpoints } from "../utils/useWindowSizeBreakpoint";
import { formatNumber } from "../utils/formatting";
import type { WorkMapColumn } from "../ApiTypes";
import type { VisibleRow, WorkMapV2Item } from "./filterWorkMap";
import { ReviewerField, type ReviewerEditing } from "./ReviewerField";

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

export function useTableLayout(columns: WorkMapColumn[]) {
  const breakpoint = useWindowSizeBreakpoints();
  const phone = breakpoint === "xs";
  const visibleColumns = columns.filter((column) => {
    if (column === "due_date" || column === "space") return breakpoint === "lg" || breakpoint === "xl";
    if (column === "champion" || column === "reviewer" || column === "next_step") return breakpoint === "xl";
    return true;
  });
  return { phone, visibleColumns };
}

export function Table({
  rows,
  columns,
  onToggle,
  formattedTimePreferences,
  reviewerEditing,
  quickAdd,
  organize,
}: {
  quickAdd?: (item: WorkMapV2Item) => React.ReactNode;
  reviewerEditing?: ReviewerEditing;
  organize?: {
    controls: (row: VisibleRow) => React.ReactNode;
    rowProps: (row: VisibleRow) => React.HTMLAttributes<HTMLTableRowElement>;
  };
  rows: VisibleRow[];
  columns: WorkMapColumn[];
  onToggle: (id: string) => void;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  const { t } = useTranslation();
  const labels = columnLabels(t);
  const { phone, visibleColumns } = useTableLayout(columns);
  const widths = {
    name: "auto",
    status: phone ? "96px" : "124px",
    progress: phone ? "80px" : "144px",
    due_date: "110px",
    space: "12%",
    champion: "10%",
    reviewer: "10%",
    next_step: "18%",
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          {visibleColumns.map((c) => (
            <col key={c} style={{ width: widths[c] }} />
          ))}
        </colgroup>
        <thead className="h-9 border-b border-surface-outline bg-surface-dimmed text-xs text-content-dimmed dark:bg-[#282b32]">
          <tr>
            {visibleColumns.map((c) => (
              <th key={c} scope="col" className="px-1 font-medium first:pl-2 sm:px-3 sm:first:pl-7">
                {labels[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.item.id}
              {...organize?.rowProps(row)}
              className={`group/row h-[46px] border-b border-surface-outline ${row.item.type === "goal" ? "bg-surface-dimmed dark:bg-[#25272d]" : ""}`}
            >
              <th
                scope="row"
                colSpan={row.contextOnly ? visibleColumns.length : 1}
                className="px-1 py-1 pl-2 text-left font-normal sm:px-3 sm:pl-7"
              >
                <div className="flex items-center gap-1">
                  {organize?.controls(row)}
                  <RowName row={row} onToggle={onToggle} compact={phone} />
                  {!row.contextOnly && quickAdd?.(row.item)}
                </div>
              </th>
              {!row.contextOnly &&
                visibleColumns
                  .filter((c) => c !== "name")
                  .map((column) =>
                    column === "reviewer" && reviewerEditing?.canEdit(row.item.id) ? (
                      <td key={column} className="px-3">
                        <ReviewerField item={row.item} editing={reviewerEditing} />
                      </td>
                    ) : (
                      <Detail
                        key={column}
                        column={column}
                        item={row.item}
                        preferences={formattedTimePreferences}
                        phone={phone}
                      />
                    ),
                  )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RowName({
  row,
  onToggle,
  compact = false,
}: {
  row: VisibleRow;
  onToggle: (id: string) => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { item, children, contextOnly, expanded, depth } = row;
  const ItemIcon = item.type === "goal" ? IconGoal : IconProject;
  const Chevron = expanded ? IconChevronDown : IconChevronRight;

  return (
    <div
      className={`flex min-w-0 items-center ${compact ? "gap-1" : "gap-2"}`}
      style={{ paddingInlineStart: compact ? `min(${depth * 25}px, 25%)` : depth * 25 }}
    >
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
      <ItemIcon size={compact ? 18 : 23} className="shrink-0" />
      <BlackLink
        to={item.itemPath}
        underline="hover"
        title={item.name}
        className={compact ? "min-w-0 [overflow-wrap:anywhere]" : "truncate"}
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
  phone,
}: {
  column: WorkMapColumn;
  item: WorkMapV2Item;
  preferences: FormattedTimePreferences;
  phone: boolean;
}) {
  const dueDate = item.timeframe?.contextualEndDate;
  const calendarDate = parseDate(dueDate?.date);
  const status =
    item.type === "project" && item.state === "closed" && item.status === "achieved" ? "completed" : item.status;
  switch (column) {
    case "status":
      return (
        <td data-test-id="work-map-status" className={phone ? "px-1" : "px-3"}>
          <StatusBadge status={status} className="max-w-full !whitespace-normal" />
        </td>
      );
    case "progress":
      return (
        <td className={phone ? "px-1" : "px-3"}>
          {item.progress === null ? (
            "—"
          ) : (
            <div className="flex items-center gap-2 text-xs text-content-dimmed">
              <div className="w-[70px] shrink-0">
                <ProgressBar
                  progress={item.progress}
                  size="sm"
                  status={item.status === "outdated" ? undefined : item.status}
                />
              </div>
              <span className={phone ? "sr-only" : "w-10 shrink-0 text-right tabular-nums"}>
                {formatNumber(item.progress / 100, preferences.locale, { style: "percent" })}
              </span>
            </div>
          )}
        </td>
      );
    case "due_date":
      return (
        <td className="px-3 text-[13px] text-content-dimmed">
          <DateDisplay
            date={dueDate && calendarDate ? { ...dueDate, date: calendarDate } : null}
            locale={preferences.locale}
            placeholder="—"
          />
        </td>
      );
    case "space":
      return (
        <td className="truncate px-3 text-[13px] text-content-dimmed">
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
        <td className="truncate px-3 text-[13px] text-content-dimmed" title={item.nextStep}>
          {item.nextStep || "—"}
        </td>
      );
    default:
      return null;
  }
}
