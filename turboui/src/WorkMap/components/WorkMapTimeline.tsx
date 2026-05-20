import React from "react";
import { WorkMap } from ".";
import { BlackLink } from "../../Link";
import { IconArrowLeft, IconArrowRight, IconFlag, IconFlagFilled } from "../../icons";
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
import { flattenTimelineItems, normalizeTimelineDate, toTimelineItem, type TimelineItem, type TimelineMilestone } from "../utils/timelineItem";

interface Props {
  items: WorkMap.Item[];
  tab: WorkMap.Filter;
}

interface MonthGroup {
  key: string;
  label: string;
  startColumn: number;
  span: number;
}

const TIMELINE_LAYOUT = {
  rowHeight: 58,
  bottomPadding: 24,
  barTop: 8,
  barHeight: 40,
  milestoneTop: 31,
  milestoneIconSize: 16,
  continuationInset: 14,
};

type MilestonePlacement = "start" | "middle" | "end";

interface TimelineViewport {
  left: number;
  right: number;
}

export function WorkMapTimeline({ items, tab }: Props) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const centeredRangeRef = React.useRef<string | null>(null);
  const [viewport, setViewport] = React.useState<TimelineViewport | null>(null);
  const flattenedItems = React.useMemo(() => flattenTimelineItems(items), [items]);
  const timelineItems = React.useMemo(() => flattenedItems.map(toTimelineItem), [flattenedItems]);
  const hiddenUndatedCount = timelineItems.filter((item) => !item.startDate && !item.endDate).length;

  const visibleItems = React.useMemo(
    () =>
      timelineItems
        .filter((item) => item.startDate || item.endDate)
        .sort(compareTimelineItems),
    [timelineItems],
  );

  const range = visibleItems.length > 0 ? calculateRange(visibleItems) : null;
  const columns = range ? buildColumns(range.start, range.end, "week") : [];
  const rangeStart = range?.start.getTime() ?? 0;
  const rangeEnd = range?.end.getTime() ?? 0;
  const rangeMs = Math.max(rangeEnd - rangeStart, 1);
  const timelineMinWidth = Math.max(columns.length * 96, 820);
  const today = new Date();
  const todayLeft = range ? getMarkerPosition(today, rangeStart, rangeEnd) : null;
  const todayLabel = todayLeft === null ? null : formatMarkerDate(today);
  const monthGroups = buildMonthGroups(columns);
  const highlightedColumnKey = columns.find((column) => columnContainsDate(column, today))?.key ?? null;
  const centeredRangeKey = todayLeft === null ? null : `${rangeStart}:${rangeEnd}:${timelineMinWidth}`;

  const updateViewport = React.useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    setViewport(calculateTimelineViewport(scrollContainer));
  }, []);

  React.useEffect(() => {
    if (!centeredRangeKey || todayLeft === null || centeredRangeRef.current === centeredRangeKey) return;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const frame = window.requestAnimationFrame(() => {
      const markerLeft = scrollContainer.scrollWidth * (todayLeft / 100);
      const targetLeft = markerLeft - scrollContainer.clientWidth / 2;
      const maxLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

      scrollContainer.scrollLeft = Math.max(0, Math.min(targetLeft, maxLeft));
      centeredRangeRef.current = centeredRangeKey;
      setViewport(calculateTimelineViewport(scrollContainer));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [centeredRangeKey, todayLeft]);

  React.useEffect(() => {
    updateViewport();
  }, [timelineMinWidth, updateViewport]);

  if (items.length === 0) {
    return <TimelineEmptyState message={emptyStateMessage(tab)} />;
  }

  if (visibleItems.length === 0) {
    return <TimelineEmptyState message="Nothing in this view has dates yet." hiddenUndatedCount={hiddenUndatedCount} />;
  }

  return (
    <div className="bg-surface-base rounded-b-lg">
      {hiddenUndatedCount > 0 && (
        <div className="px-4 py-3 border-b border-surface-outline dark:border-gray-700 text-xs text-content-dimmed">
          {hiddenUndatedCount} hidden without dates
        </div>
      )}

      <div ref={scrollContainerRef} className="overflow-x-auto" onScroll={updateViewport}>
        <div
          className="relative min-w-full px-4"
          style={{ minWidth: `${timelineMinWidth}px`, paddingBottom: TIMELINE_LAYOUT.bottomPadding }}
        >
          <TodayBadge left={todayLeft} label={todayLabel} />
          <TimelineMarker left={todayLeft} className="bg-brand-1/90 dark:bg-blue-300/90" />

          <TimelineHeader columns={columns} monthGroups={monthGroups} highlightedColumnKey={highlightedColumnKey} />

          {visibleItems.map((item) => (
            <TimelineRow
              key={item.id}
              item={item}
              columns={columns}
              rangeStart={rangeStart}
              rangeMs={rangeMs}
              highlightedColumnKey={highlightedColumnKey}
              viewport={viewport}
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
  highlightedColumnKey,
  viewport,
}: {
  item: TimelineItem;
  columns: Column[];
  rangeStart: number;
  rangeMs: number;
  highlightedColumnKey: string | null;
  viewport: TimelineViewport | null;
}) {
  const barStartDate = getBarStartDate(item);
  const left = barStartDate ? clampPercent(((barStartDate.getTime() - rangeStart) / rangeMs) * 100) : null;
  const finiteEnd = item.endDate ? clampPercent(((item.endDate.getTime() - rangeStart) / rangeMs) * 100) : null;
  const hasInfiniteBar = item.startDate && !item.endDate;
  const barWidth = left !== null && finiteEnd !== null ? Math.max(finiteEnd - left, 8) : null;
  const visualBarEnd = left === null ? null : hasInfiniteBar ? Math.max(100, left + 12) : barWidth === null ? null : left + barWidth;
  const rangeLabel = formatRangeLabel(item);

  return (
    <div className="border-b border-surface-outline/70 dark:border-gray-700/70">
      <div className="relative bg-surface-base" style={{ height: TIMELINE_LAYOUT.rowHeight }}>
        <TimelineGrid columns={columns} highlightedColumnKey={highlightedColumnKey} />

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

          {left !== null && visualBarEnd !== null && (
            <BarContinuationIndicators barStart={left} barEnd={visualBarEnd} viewport={viewport} />
          )}

          {item.milestones.map((milestone) => (
            <MilestoneMarker
              key={milestone.id}
              milestone={milestone}
              left={getMarkerPosition(milestone.dueDate, rangeStart, rangeStart + rangeMs)}
              outsideBar={isOutsideBar(milestone.dueDate, barStartDate, item.endDate)}
              placement={milestonePlacement(milestone.dueDate, barStartDate, item.endDate)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BarContinuationIndicators({
  barStart,
  barEnd,
  viewport,
}: {
  barStart: number;
  barEnd: number;
  viewport: TimelineViewport | null;
}) {
  if (!viewport) return null;

  const showLeft = viewport.left > 0 && barStart < viewport.left && barEnd > viewport.left;
  const showRight = viewport.right < 100 && barStart < viewport.right && barEnd > viewport.right;

  if (!showLeft && !showRight) return null;

  return (
    <>
      {showLeft && <BarContinuationIndicator direction="left" left={viewport.left} />}
      {showRight && <BarContinuationIndicator direction="right" left={viewport.right} />}
    </>
  );
}

function BarContinuationIndicator({ direction, left }: { direction: "left" | "right"; left: number }) {
  const Icon = direction === "left" ? IconArrowLeft : IconArrowRight;

  return (
    <div
      className={classNames(
        "pointer-events-none absolute z-40 flex size-5 items-center justify-center rounded-md border border-surface-outline bg-surface-base/90 text-content-dimmed shadow-sm backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800/90 dark:text-gray-200",
        { "-translate-x-full": direction === "right" },
      )}
      style={{
        left:
          direction === "left"
            ? `calc(${left}% + ${TIMELINE_LAYOUT.continuationInset}px)`
            : `calc(${left}% - ${TIMELINE_LAYOUT.continuationInset}px)`,
        top: TIMELINE_LAYOUT.barTop + 10,
      }}
    >
      <Icon size={14} stroke={2.5} />
    </div>
  );
}

function TimelineHeader({
  columns,
  monthGroups,
  highlightedColumnKey,
}: {
  columns: Column[];
  monthGroups: MonthGroup[];
  highlightedColumnKey: string | null;
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
              "bg-surface-dimmed/70 dark:bg-gray-800/60": column.key === highlightedColumnKey,
            })}
          >
            {formatWeekCellLabel(column.start)}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineGrid({ columns, highlightedColumnKey }: { columns: Column[]; highlightedColumnKey: string | null }) {
  return (
    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(96px, 1fr))` }}>
      {columns.map((column, index) => (
        <div
          key={column.key}
          className={classNames("border-l border-surface-outline/70 dark:border-gray-700/70", {
            "border-l-0": index === 0,
            "bg-surface-dimmed/40 dark:bg-gray-800/40": column.key === highlightedColumnKey,
          })}
        />
      ))}
    </div>
  );
}

function TimelineMarker({ left, className }: { left: number | null; className: string }) {
  if (left === null) return null;

  return (
    <div
      className={classNames("pointer-events-none absolute top-0 z-20 w-px", className)}
      style={{ left: `${left}%`, bottom: TIMELINE_LAYOUT.bottomPadding }}
    />
  );
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
        "absolute flex min-w-0 items-start rounded-lg border bg-surface-dimmed text-content-accent shadow-sm transition-colors hover:border-content-subtle dark:bg-gray-800/90 dark:text-gray-100 dark:shadow-none dark:hover:border-gray-500",
        tone.border,
        { "rounded-r-none border-r-0": openEnded },
      )}
      style={{ ...style, top: TIMELINE_LAYOUT.barTop, height: TIMELINE_LAYOUT.barHeight }}
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
  placement,
}: {
  milestone: TimelineMilestone;
  left: number | null;
  outsideBar: boolean;
  placement: MilestonePlacement;
}) {
  if (left === null) return null;

  const done = milestone.status === "done";
  const title = `${milestone.name} · ${formatMilestoneDate(milestone.dueDate)}${done ? " · Done" : ""}`;

  return (
    <BlackLink
      to={milestone.link}
      className={classNames("group absolute z-30", milestoneTranslateClass(placement))}
      style={{ left: `${left}%`, top: TIMELINE_LAYOUT.milestoneTop }}
      title={title}
      underline="never"
    >
      <span
        className={classNames(
          "flex h-4 w-4 items-center justify-center rounded-sm transition group-hover:scale-110",
          outsideBar
            ? "bg-amber-50 text-amber-700 opacity-95 ring-1 ring-amber-300/90 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-400/70"
            : "opacity-85 group-hover:opacity-100",
        )}
      >
        {done ? (
          <IconFlagFilled size={12} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <IconFlag
            size={12}
            className={classNames({
              "text-amber-700 dark:text-amber-300": outsideBar,
              "text-content-dimmed drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] dark:text-gray-300 dark:drop-shadow-none":
                !outsideBar,
            })}
            stroke={2.5}
          />
        )}
      </span>
      <span
        className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-surface-outline bg-surface-base px-2 py-1 text-[11px] font-medium text-content-accent shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
        style={{ top: TIMELINE_LAYOUT.milestoneIconSize }}
      >
        {title}
      </span>
    </BlackLink>
  );
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
  const normalized = normalizeTimelineDate(date);
  if (!normalized) return false;

  const value = normalized.getTime();
  return value >= column.start.getTime() && value <= column.end.getTime();
}

function isOutsideBar(date: Date, startDate: Date | null, endDate: Date | null) {
  if (startDate && date < startDate) return true;
  if (endDate && date > endDate) return true;
  return false;
}

function milestonePlacement(date: Date, startDate: Date | null, endDate: Date | null): MilestonePlacement {
  if (startDate && sameDay(date, startDate)) return "start";
  if (endDate && sameDay(date, endDate)) return "end";
  return "middle";
}

function milestoneTranslateClass(placement: MilestonePlacement) {
  switch (placement) {
    case "start":
      return "translate-x-0";
    case "end":
      return "-translate-x-full";
    default:
      return "-translate-x-1/2";
  }
}

function sameDay(a: Date, b: Date) {
  return normalizeTimelineDate(a)?.getTime() === normalizeTimelineDate(b)?.getTime();
}

function calculateTimelineViewport(scrollContainer: HTMLDivElement): TimelineViewport {
  const scrollWidth = Math.max(scrollContainer.scrollWidth, 1);

  return {
    left: clampPercent((scrollContainer.scrollLeft / scrollWidth) * 100),
    right: clampPercent(((scrollContainer.scrollLeft + scrollContainer.clientWidth) / scrollWidth) * 100),
  };
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
