import React from "react";
import { WorkMap } from ".";
import { BlackLink } from "../../Link";
import { IconFlag, IconFlagFilled } from "../../icons";
import classNames from "../../utils/classnames";
import {
  buildColumns,
  calculateRange,
  clampPercent,
  compareTimelineItems,
  formatMarkerDate,
  formatMonthLabel,
  formatRangeLabel,
  formatWeekCellLabel,
  getBarStartDate,
  getMarkerPosition,
  type TimelineColumn as Column,
} from "../utils/timeline";

interface Props {
  items: WorkMap.Item[];
  tab: WorkMap.Filter;
}

interface TimelineItem {
  id: string;
  name: string;
  type: WorkMap.Item["type"];
  status: WorkMap.Item["status"];
  owner: WorkMap.Item["owner"];
  space: WorkMap.Item["space"];
  itemPath: string;
  startDate: Date | null;
  endDate: Date | null;
  milestones: TimelineMilestone[];
}

interface TimelineMilestone {
  id: string;
  name: string;
  status: WorkMap.Milestone["status"];
  link: string;
  dueDate: Date;
}

interface MonthGroup {
  key: string;
  label: string;
  startColumn: number;
  span: number;
}

export function WorkMapTimeline({ items, tab }: Props) {
  const flattenedItems = React.useMemo(() => flattenItems(items), [items]);
  const timelineItems = React.useMemo(() => flattenedItems.map(toTimelineItem), [flattenedItems]);
  const hiddenUndatedCount = timelineItems.filter((item) => !item.startDate && !item.endDate).length;

  const visibleItems = React.useMemo(
    () =>
      timelineItems
        .filter((item) => item.startDate || item.endDate)
        .sort(compareTimelineItems),
    [timelineItems],
  );

  if (items.length === 0) {
    return <TimelineEmptyState message={emptyStateMessage(tab)} />;
  }

  if (visibleItems.length === 0) {
    return <TimelineEmptyState message="Nothing in this view has dates yet." hiddenUndatedCount={hiddenUndatedCount} />;
  }

  const range = calculateRange(visibleItems);
  const columns = buildColumns(range.start, range.end, "week");
  const rangeStart = range.start.getTime();
  const rangeEnd = range.end.getTime();
  const rangeMs = Math.max(rangeEnd - rangeStart, 1);
  const timelineMinWidth = Math.max(columns.length * 96, 820);
  const todayLeft = getMarkerPosition(new Date(), rangeStart, rangeEnd);
  const todayLabel = todayLeft === null ? null : formatMarkerDate(new Date());
  const monthGroups = buildMonthGroups(columns);

  return (
    <div className="bg-surface-base rounded-b-lg border-t border-surface-outline dark:border-gray-700">
      {hiddenUndatedCount > 0 && (
        <div className="px-4 py-3 border-b border-surface-outline dark:border-gray-700 text-xs text-content-dimmed">
          {hiddenUndatedCount} hidden without dates
        </div>
      )}

      <div className="overflow-x-auto">
        <div
          className="relative min-w-full px-4 pb-6"
          style={{ minWidth: `${timelineMinWidth}px` }}
        >
          <TodayBadge left={todayLeft} label={todayLabel} />
          <TimelineMarker left={todayLeft} className="bg-brand-1/90 dark:bg-blue-300/90" />

          <TimelineHeader columns={columns} monthGroups={monthGroups} />

          {visibleItems.map((item) => (
            <TimelineRow
              key={item.id}
              item={item}
              columns={columns}
              rangeStart={rangeStart}
              rangeMs={rangeMs}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({
  item,
  columns,
  rangeStart,
  rangeMs,
}: {
  item: TimelineItem;
  columns: Column[];
  rangeStart: number;
  rangeMs: number;
}) {
  const barStartDate = getBarStartDate(item);
  const left = barStartDate ? clampPercent(((barStartDate.getTime() - rangeStart) / rangeMs) * 100) : null;
  const finiteEnd = item.endDate ? clampPercent(((item.endDate.getTime() - rangeStart) / rangeMs) * 100) : null;
  const hasInfiniteBar = item.startDate && !item.endDate;
  const barWidth = left !== null && finiteEnd !== null ? Math.max(finiteEnd - left, 8) : null;
  const rangeLabel = formatRangeLabel(item);

  return (
    <div className="border-b border-surface-outline/70 dark:border-gray-700/70">
      <div className="relative h-[58px] bg-surface-base">
        <TimelineGrid columns={columns} />

        <div className="absolute inset-y-0 left-0 right-0">
          {barWidth !== null && left !== null && (
            <BarLabel
                to={item.itemPath}
                name={item.name}
                rangeLabel={rangeLabel}
                status={item.status}
                openEnded={false}
                style={{ left: `${left}%`, width: `${barWidth}%` }}
              />
            )}

          {hasInfiniteBar && left !== null && (
            <BarLabel
              to={item.itemPath}
              name={item.name}
              rangeLabel={rangeLabel}
              status={item.status}
              openEnded
              style={{ left: `${left}%`, width: `${Math.max(100 - left, 12)}%` }}
            />
          )}

          {item.milestones.map((milestone) => (
            <MilestoneMarker
              key={milestone.id}
              milestone={milestone}
              left={getMarkerPosition(milestone.dueDate, rangeStart, rangeStart + rangeMs)}
              outsideBar={isOutsideBar(milestone.dueDate, barStartDate, item.endDate)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineHeader({
  columns,
  monthGroups,
}: {
  columns: Column[];
  monthGroups: MonthGroup[];
}) {
  return (
    <div className="sticky left-0 z-10 border-b border-surface-outline bg-surface-base dark:border-gray-700">
      <div
        className="grid border-t border-surface-outline/70 text-xs font-semibold text-content-accent dark:border-gray-700"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(96px, 1fr))` }}
      >
        {monthGroups.map((group) => (
          <div
            key={group.key}
            className="border-l border-surface-outline/70 px-3 py-2 first:border-l-0 dark:border-gray-700"
            style={{ gridColumn: `${group.startColumn + 1} / span ${group.span}` }}
          >
            {group.label}
          </div>
        ))}
      </div>

      <div
        className="grid text-[11px] font-medium text-content-dimmed"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(96px, 1fr))` }}
      >
        {columns.map((column, index) => (
          <div
            key={column.key}
            className={classNames("border-l border-surface-outline/70 px-3 py-2 dark:border-gray-700", {
              "border-l-0": index === 0,
              "bg-surface-dimmed/70 dark:bg-gray-800/60": columnContainsDate(column, new Date()),
            })}
          >
            {formatWeekCellLabel(column.start)}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineGrid({ columns }: { columns: Column[] }) {
  return (
    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(96px, 1fr))` }}>
      {columns.map((column, index) => (
        <div
          key={column.key}
          className={classNames("border-l border-surface-outline/70 dark:border-gray-700/70", {
            "border-l-0": index === 0,
            "bg-surface-dimmed/40 dark:bg-gray-800/40": columnContainsDate(column, new Date()),
          })}
        />
      ))}
    </div>
  );
}

function TimelineMarker({ left, className }: { left: number | null; className: string }) {
  if (left === null) return null;

  return <div className={classNames("pointer-events-none absolute bottom-6 top-0 z-20 w-px", className)} style={{ left: `${left}%` }} />;
}

function TodayBadge({ left, label }: { left: number | null; label: string | null }) {
  if (left === null || !label) return null;

  return (
    <div className="pointer-events-none absolute top-1 z-30 -translate-x-1/2" style={{ left: `${left}%` }}>
      <div className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold leading-none text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900 dark:text-blue-100 dark:shadow-none">
        Today · {label}
      </div>
    </div>
  );
}

function BarLabel({
  to,
  name,
  rangeLabel,
  status,
  openEnded,
  style,
}: {
  to: string;
  name: string;
  rangeLabel: string | null;
  status: WorkMap.Item["status"];
  openEnded: boolean;
  style: React.CSSProperties;
}) {
  const tone = barTone(status);

  return (
    <div
      className={classNames(
        "absolute top-2 flex h-10 min-w-0 items-start rounded-lg border bg-surface-dimmed text-content-accent shadow-sm transition-colors hover:border-content-subtle dark:bg-gray-800/90 dark:text-gray-100 dark:shadow-none dark:hover:border-gray-500",
        tone.border,
        { "rounded-r-none border-r-0": openEnded },
      )}
      style={style}
      title={rangeLabel ? `${name} · ${rangeLabel}` : name}
    >
      <span className={classNames("h-full w-1 shrink-0 rounded-l-lg", tone.accent)} />
      <BlackLink to={to} className="min-w-0 truncate px-3 pt-2 text-sm font-medium leading-none" underline="hover">
        {name}
      </BlackLink>
      {openEnded && (
        <span className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-r from-transparent to-surface-base dark:to-[#1f1e24]" />
      )}
    </div>
  );
}

function MilestoneMarker({
  milestone,
  left,
  outsideBar,
}: {
  milestone: TimelineMilestone;
  left: number | null;
  outsideBar: boolean;
}) {
  if (left === null) return null;

  const done = milestone.status === "done";
  const title = `${milestone.name} · ${formatMilestoneDate(milestone.dueDate)}${done ? " · Done" : ""}`;

  return (
    <BlackLink
      to={milestone.link}
      className="group absolute top-[31px] z-30 -translate-x-1/2"
      style={{ left: `${left}%` }}
      title={title}
      underline="never"
    >
      <span
        className={classNames(
          "flex h-4 w-4 items-center justify-center rounded-sm opacity-85 transition group-hover:scale-110 group-hover:opacity-100",
          { "bg-amber-50 ring-1 ring-amber-300/80 dark:bg-amber-950 dark:ring-amber-500/80": outsideBar },
        )}
      >
        {done ? (
          <IconFlagFilled size={12} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <IconFlag
            size={12}
            className="text-content-dimmed drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] dark:text-gray-300 dark:drop-shadow-none"
            stroke={2.5}
          />
        )}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-4 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-surface-outline bg-surface-base px-2 py-1 text-[11px] font-medium text-content-accent shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50">
        {title}
      </span>
    </BlackLink>
  );
}

function flattenItems(items: WorkMap.Item[]): WorkMap.Item[] {
  return items.flatMap((item) => [item, ...flattenItems(item.children)]);
}

function toTimelineItem(item: WorkMap.Item): TimelineItem {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    status: item.status,
    owner: item.owner,
    space: item.space,
    itemPath: item.itemPath,
    startDate: normalizeDate(item.timeframe?.startDate?.date),
    endDate: normalizeDate(item.timeframe?.endDate?.date),
    milestones: item.milestones
      .map((milestone) => {
        const dueDate = normalizeDate(milestone.dueDate?.date);
        if (!dueDate) return null;

        return {
          id: milestone.id,
          name: milestone.name,
          status: milestone.status,
          link: milestone.link,
          dueDate,
        };
      })
      .filter((milestone): milestone is TimelineMilestone => Boolean(milestone))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
  };
}

function normalizeDate(date: Date | null | undefined) {
  if (!date) return null;

  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function buildMonthGroups(columns: Column[]): MonthGroup[] {
  const groups: MonthGroup[] = [];

  columns.forEach((column, index) => {
    const key = `${column.start.getFullYear()}-${column.start.getMonth()}`;
    const previous = groups[groups.length - 1];

    if (previous && previous.key === key) {
      previous.span += 1;
      return;
    }

    groups.push({
      key,
      label: formatMonthLabel(column.start),
      startColumn: index,
      span: 1,
    });
  });

  return groups;
}

function columnContainsDate(column: Column, date: Date) {
  const value = normalizeDate(date)?.getTime();
  if (!value) return false;

  return value >= column.start.getTime() && value <= column.end.getTime();
}

function isOutsideBar(date: Date, startDate: Date | null, endDate: Date | null) {
  if (startDate && date < startDate) return true;
  if (endDate && date > endDate) return true;
  return false;
}

function barTone(status: WorkMap.Item["status"]) {
  switch (status) {
    case "off_track":
      return { border: "border-red-200 dark:border-red-700/70", accent: "bg-red-400 dark:bg-red-400" };
    case "caution":
      return { border: "border-amber-200 dark:border-amber-600/80", accent: "bg-amber-400 dark:bg-amber-400" };
    case "on_track":
      return { border: "border-emerald-200 dark:border-emerald-700/80", accent: "bg-emerald-400 dark:bg-emerald-400" };
    default:
      return { border: "border-surface-outline dark:border-gray-600", accent: "bg-surface-outline dark:bg-gray-500" };
  }
}

function formatMilestoneDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function TimelineEmptyState({ message, hiddenUndatedCount }: { message: string; hiddenUndatedCount?: number }) {
  return (
    <div className="px-6 py-12 text-sm text-content-dimmed">
      <div>{message}</div>
      {hiddenUndatedCount ? <div className="mt-2">{hiddenUndatedCount} items are hidden because they do not have dates.</div> : null}
    </div>
  );
}

function emptyStateMessage(tab: WorkMap.Filter) {
  switch (tab) {
    case "goals":
      return "No goals to show.";
    case "projects":
      return "No projects to show.";
    case "completed":
      return "No completed work to show.";
    case "paused":
      return "No paused work to show.";
    default:
      return "No work to show.";
  }
}
