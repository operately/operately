import React from "react";
import { WorkMap } from ".";
import { BlackLink } from "../../Link";
import { IconInfinity } from "../../icons";
import classNames from "../../utils/classnames";
import {
  buildColumns,
  calculateRange,
  clampPercent,
  chooseScale,
  compareTimelineItems,
  formatMarkerDate,
  formatRangeLabel,
  getBarStartDate,
  getDateAtPosition,
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
}

export function WorkMapTimeline({ items, tab }: Props) {
  const [hoverLeft, setHoverLeft] = React.useState<number | null>(null);
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
  const scale = chooseScale(range.start, range.end);
  const columns = buildColumns(range.start, range.end, scale);
  const rangeStart = range.start.getTime();
  const rangeEnd = range.end.getTime();
  const rangeMs = Math.max(rangeEnd - rangeStart, 1);
  const timelineMinWidth = Math.max(columns.length * 72, 720);
  const todayLeft = getMarkerPosition(new Date(), rangeStart, rangeEnd);
  const hoverDate = hoverLeft === null ? null : getDateAtPosition(hoverLeft, rangeStart, rangeEnd);
  const todayDate = getDateAtPosition(todayLeft, rangeStart, rangeEnd);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const nextLeft = clampPercent((relativeX / rect.width) * 100);
    setHoverLeft(nextLeft);
  };

  return (
    <div className="bg-surface-base rounded-b-lg">
      {hiddenUndatedCount > 0 && (
        <div className="px-4 py-3 border-b border-surface-outline text-xs text-content-dimmed">
          {hiddenUndatedCount} hidden without dates
        </div>
      )}

      <div className="overflow-x-auto">
        <div
          className="relative min-w-full px-4 pb-4"
          style={{ minWidth: `${timelineMinWidth}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverLeft(null)}
        >
          <MarkerBadge
            left={todayLeft}
            label={todayDate ? formatMarkerDate(todayDate) : null}
            className="border border-red-200 bg-red-50 text-red-700"
          />
          <MarkerBadge
            left={hoverLeft}
            label={hoverDate ? formatMarkerDate(hoverDate) : null}
            className="border border-sky-200 bg-sky-50 text-sky-800"
          />
          <TimelineMarker left={todayLeft} className="bg-red-500/90" />
          <TimelineMarker left={hoverLeft} className="bg-red-400/60" />

          <div
            className="grid border-b border-surface-outline bg-surface-base text-xs font-semibold text-content-dimmed"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(72px, 1fr))` }}
          >
            {columns.map((column, index) => (
              <div
                key={column.key}
                className={classNames("px-3 py-3 border-l border-surface-outline/70", { "border-l-0": index === 0 })}
              >
                <div>{column.label}</div>
                <div className="mt-1 text-[11px] text-content-subtle">{column.shortLabel}</div>
              </div>
            ))}
          </div>

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

  return (
    <div className="border-b border-surface-outline/70 py-2">
      <div className="relative h-[64px] bg-surface-base">
        <TimelineGrid columns={columns} />

        <div className="absolute inset-y-0 left-0 right-0">
          {barWidth !== null && left !== null && (
            <BarLabel
              to={item.itemPath}
              name={item.name}
              className="border-[#d9e2f1] bg-[#f7f9fc] text-content-accent"
              style={{ left: `${left}%`, width: `${barWidth}%` }}
            />
          )}

          {hasInfiniteBar && left !== null && (
            <>
              <BarLabel
                to={item.itemPath}
                name={item.name}
                className="border-[#d9e2f1] bg-gradient-to-r from-[#f7f9fc] to-[#eef5ff]/80 text-content-accent"
                style={{ left: `${left}%`, width: `${Math.max(100 - left, 12)}%` }}
              />
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-surface-outline bg-surface-base/90 px-2 py-1 text-[11px] text-content-dimmed">
                <IconInfinity size={12} />
                <span>No end</span>
              </div>
            </>
          )}

          <TimelineRangeLabel item={item} />
        </div>
      </div>
    </div>
  );
}

function TimelineGrid({ columns }: { columns: Column[] }) {
  return (
    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(72px, 1fr))` }}>
      {columns.map((column, index) => (
        <div key={column.key} className={classNames("border-l border-surface-outline/70", { "border-l-0": index === 0 })} />
      ))}
    </div>
  );
}

function TimelineRangeLabel({ item }: { item: TimelineItem }) {
  const label = formatRangeLabel(item);

  if (!label) return null;

  return (
    <div className="absolute right-2 bottom-1 text-[11px] text-content-dimmed">
      {label}
    </div>
  );
}

function TimelineMarker({ left, className }: { left: number | null; className: string }) {
  if (left === null) return null;

  return <div className={classNames("pointer-events-none absolute bottom-4 top-0 z-20 w-px", className)} style={{ left: `${left}%` }} />;
}

function MarkerBadge({
  left,
  label,
  className,
}: {
  left: number | null;
  label: string | null;
  className: string;
}) {
  if (left === null || !label) return null;

  return (
    <div
      className="pointer-events-none absolute top-2 z-30 -translate-x-1/2"
      style={{ left: `${clampPercent(left)}%` }}
    >
      <div className={classNames("rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide shadow-sm", className)}>
        {label}
      </div>
    </div>
  );
}

function BarLabel({
  to,
  name,
  style,
  className,
}: {
  to: string;
  name: string;
  style: React.CSSProperties;
  className: string;
}) {
  return (
    <div
      className={classNames(
        "absolute top-2 flex h-9 min-w-0 items-center rounded-xl border px-3 shadow-sm",
        className,
      )}
      style={style}
    >
      <BlackLink to={to} className="truncate text-sm font-medium leading-none" underline="hover">
        {name}
      </BlackLink>
    </div>
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
  };
}

function normalizeDate(date: Date | null | undefined) {
  if (!date) return null;

  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
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
