import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarQuarters,
  differenceInCalendarWeeks,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { WorkMapTimelineScale } from "../ApiTypes";
import { SecondaryButton } from "../Button";
import type { FormattedTimePreferences } from "../FormattedTime";
import { IconChevronLeft, IconChevronRight } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import { formatDate } from "../utils/formatting";
import { parseDate } from "../utils/time";
import { dateInTimezone } from "../utils/timezone";
import type { VisibleRow, WorkMapV2Item } from "./filterWorkMap";
import { RowName } from "./Table";

const MIN_PERIOD_WIDTH = 112;
const FALLBACK_PANE_WIDTH = 900;

/**
 * `periodsPerPage` is how many periods fit on a wide screen.
 * `pageStart` aligns a full page to a natural boundary (e.g. months start at the quarter).
 */
const calendars = {
  weeks: {
    periodStart: startOfWeek,
    pageStart: startOfWeek,
    add: addWeeks,
    difference: differenceInCalendarWeeks,
    periodsPerPage: 6,
  },
  months: {
    periodStart: startOfMonth,
    pageStart: startOfQuarter,
    add: addMonths,
    difference: differenceInCalendarMonths,
    periodsPerPage: 3,
  },
  quarters: {
    periodStart: startOfQuarter,
    pageStart: startOfYear,
    add: addQuarters,
    difference: differenceInCalendarQuarters,
    periodsPerPage: 4,
  },
};

type Calendar = (typeof calendars)[WorkMapTimelineScale];

interface Viewport {
  left: number;
  right: number;
}

export function Timeline({
  rows,
  onToggle,
  scale,
  onScale,
  preferences,
}: {
  rows: VisibleRow[];
  onToggle: (id: string) => void;
  scale: WorkMapTimelineScale;
  onScale: (value: WorkMapTimelineScale) => void;
  preferences: FormattedTimePreferences;
}) {
  const { t } = useTranslation();
  const { locale, timezone } = preferences;
  const today = dateInTimezone(new Date(), timezone);
  const calendar = calendars[scale];

  const pane = React.useRef<HTMLDivElement>(null);
  const paneWidth = useElementWidth(pane, FALLBACK_PANE_WIDTH);
  const [anchor, setAnchor] = React.useState<Date | null>(null);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const visiblePeriods = Math.max(1, Math.min(calendar.periodsPerPage, Math.floor(paneWidth / MIN_PERIOD_WIDTH)));
  const periodWidth = paneWidth / visiblePeriods;
  const showsFullPage = visiblePeriods === calendar.periodsPerPage;
  const defaultAnchor = showsFullPage ? calendar.pageStart(today) : calendar.periodStart(today);

  // Render one page of periods before and after the anchor so native horizontal scrolling has room.
  // The arrow buttons re-anchor, so they can move beyond this window.
  const timelineStart = calendar.add(calendar.periodStart(anchor ?? defaultAnchor), -calendar.periodsPerPage);
  const periodCount = calendar.periodsPerPage * 3;
  const positionOf = (date: Date) => datePosition(date, timelineStart, calendar, periodWidth);

  React.useLayoutEffect(() => {
    if (!pane.current) return;
    pane.current.scrollLeft = calendar.periodsPerPage * periodWidth;
    setScrollLeft(pane.current.scrollLeft);
  }, [anchor, periodWidth, calendar]);

  const viewport: Viewport = { left: scrollLeft, right: scrollLeft + paneWidth };
  const firstVisible = calendar.add(timelineStart, Math.floor((viewport.left + 0.5) / periodWidth));
  const lastVisible = addDays(calendar.add(timelineStart, Math.ceil((viewport.right - 0.5) / periodWidth)), -1);
  const todayIsVisible = firstVisible <= today && today <= lastVisible;

  const changeScale = (next: WorkMapTimelineScale) => {
    if (next === scale) return;
    setAnchor(todayIsVisible ? null : firstVisible);
    onScale(next);
  };

  return (
    <section aria-label={t("Timeline")}>
      <TimelineToolbar
        range={formatVisibleRange(firstVisible, lastVisible, scale, locale)}
        scale={scale}
        onPrevious={() => setAnchor(calendar.add(firstVisible, -visiblePeriods))}
        onNext={() => setAnchor(calendar.add(firstVisible, visiblePeriods))}
        onToday={() => setAnchor(defaultAnchor)}
        onScale={changeScale}
      />

      <div className="flex border-t border-surface-outline text-sm">
        <NameColumn rows={rows} onToggle={onToggle} />

        <div
          ref={pane}
          className="min-w-0 flex-1 overflow-x-auto"
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        >
          <div className="relative" style={{ width: periodWidth * periodCount }}>
            <PeriodHeaders
              timelineStart={timelineStart}
              periodCount={periodCount}
              periodWidth={periodWidth}
              calendar={calendar}
              scale={scale}
              locale={locale}
            />
            <PeriodGridLines periodCount={periodCount} periodWidth={periodWidth} />
            <TodayMarker
              today={today}
              x={positionOf(today)}
              timelineWidth={periodWidth * periodCount}
              locale={locale}
            />

            {rows.map(({ item }) => (
              <div
                key={item.id}
                className={`relative h-[42px] overflow-hidden border-b border-surface-outline ${item.type === "goal" ? "bg-surface-dimmed/50" : ""}`}
              >
                <TimelineMark item={item} positionOf={positionOf} viewport={viewport} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function useElementWidth(ref: React.RefObject<HTMLElement>, fallback: number) {
  const [width, setWidth] = React.useState(fallback);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => setWidth(element.clientWidth || fallback);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, fallback]);

  return width;
}

/** Horizontal pixel offset of `date`, interpolating by day inside its period. */
function datePosition(date: Date, timelineStart: Date, calendar: Calendar, periodWidth: number) {
  const periodIndex = calendar.difference(date, timelineStart);
  const periodStart = calendar.add(timelineStart, periodIndex);
  const periodDays = differenceInCalendarDays(calendar.add(periodStart, 1), periodStart);
  const daysIntoPeriod = differenceInCalendarDays(date, periodStart);

  return periodWidth * (periodIndex + daysIntoPeriod / periodDays);
}

function formatVisibleRange(first: Date, last: Date, scale: WorkMapTimelineScale, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    ...(scale === "weeks" ? { day: "numeric" as const } : {}),
    year: "numeric",
  }).formatRange(first, last);
}

function formatPeriodLabel(date: Date, scale: WorkMapTimelineScale, locale: string, t: TFunction) {
  switch (scale) {
    case "quarters":
      return t("Q{{quarter}} {{year}}", {
        quarter: Math.floor(date.getMonth() / 3) + 1,
        year: date.getFullYear().toString(),
      });
    case "months":
      return formatDate(date, locale, { month: "long" });
    case "weeks":
      return formatDate(date, locale, { month: "short", day: "numeric" });
  }
}

function TimelineToolbar({
  range,
  scale,
  onPrevious,
  onNext,
  onToday,
  onScale,
}: {
  range: string;
  scale: WorkMapTimelineScale;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onScale: (value: WorkMapTimelineScale) => void;
}) {
  const { t } = useTranslation();
  const scaleLabels: Record<WorkMapTimelineScale, string> = {
    weeks: t("Weeks"),
    months: t("Months"),
    quarters: t("Quarters"),
  };

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 px-4 py-1 sm:px-7">
      <strong className="text-sm sm:text-base">{range}</strong>

      <SecondaryButton size="xs" ariaLabel={t("Previous")} icon={IconChevronLeft} onClick={onPrevious}>
        <span className="sr-only">{t("Previous")}</span>
      </SecondaryButton>
      <SecondaryButton size="xs" ariaLabel={t("Next")} icon={IconChevronRight} onClick={onNext}>
        <span className="sr-only">{t("Next")}</span>
      </SecondaryButton>
      <SecondaryButton size="xs" onClick={onToday}>
        {t("Today")}
      </SecondaryButton>

      <div className="ml-auto">
        <Menu triggerLabel={scaleLabels[scale]} align="end" size="tiny">
          {(Object.keys(calendars) as WorkMapTimelineScale[]).map((key) => (
            <MenuActionItem key={key} onClick={() => onScale(key)}>
              {scaleLabels[key]}
            </MenuActionItem>
          ))}
        </Menu>
      </div>
    </div>
  );
}

function NameColumn({ rows, onToggle }: { rows: VisibleRow[]; onToggle: (id: string) => void }) {
  const { t } = useTranslation();

  return (
    <div className="w-[45%] shrink-0 border-r border-surface-outline sm:w-[28%]">
      <div className="h-8 border-b border-surface-outline bg-surface-dimmed px-4 py-1.5 text-xs sm:px-7">
        {t("Name")}
      </div>
      {rows.map((row) => (
        <div
          key={row.item.id}
          className={`flex h-[42px] items-center overflow-hidden border-b border-surface-outline px-2 sm:px-6 ${row.item.type === "goal" ? "bg-surface-dimmed" : ""}`}
        >
          <RowName row={row} onToggle={onToggle} />
        </div>
      ))}
    </div>
  );
}

function PeriodHeaders({
  timelineStart,
  periodCount,
  periodWidth,
  calendar,
  scale,
  locale,
}: {
  timelineStart: Date;
  periodCount: number;
  periodWidth: number;
  calendar: Calendar;
  scale: WorkMapTimelineScale;
  locale: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-8 border-b border-surface-outline bg-surface-dimmed text-xs">
      {Array.from({ length: periodCount }, (_, i) => (
        <div key={i} style={{ width: periodWidth }} className="px-2 py-1.5">
          {formatPeriodLabel(calendar.add(timelineStart, i), scale, locale, t)}
        </div>
      ))}
    </div>
  );
}

function PeriodGridLines({ periodCount, periodWidth }: { periodCount: number; periodWidth: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex">
      {Array.from({ length: periodCount }, (_, i) => (
        <span key={i} className="border-r border-surface-outline" style={{ width: periodWidth }} />
      ))}
    </div>
  );
}

function TodayMarker({
  today,
  x,
  timelineWidth,
  locale,
}: {
  today: Date;
  x: number;
  timelineWidth: number;
  locale: string;
}) {
  if (x < 0 || x >= timelineWidth) return null;

  return (
    <div className="pointer-events-none absolute inset-y-0 border-l border-indigo-400" style={{ left: x }}>
      <span className="absolute top-1 -translate-x-1/2 z-[1] whitespace-nowrap rounded bg-indigo-600 px-1 text-[10px] text-white-1 dark:bg-[#506aaf]">
        {formatDate(today, locale, { month: "short", day: "numeric" })}
      </span>
    </div>
  );
}

function formatMarkDate(date: Date, locale: string, { includeYear = false } = {}) {
  return formatDate(
    date,
    locale,
    includeYear ? { month: "short", year: "numeric" } : { month: "short", day: "numeric" },
  );
}

interface BarLayout {
  bounds: { left: number; width: number };
  startsBeforeView: boolean;
  endsAfterView: boolean;
}

function TimelineMark({
  item,
  positionOf,
  viewport,
  locale,
}: {
  item: WorkMapV2Item;
  positionOf: (date: Date) => number;
  viewport: Viewport;
  locale: string;
}) {
  const { t } = useTranslation();
  const start = parseDate(item.timeframe?.contextualStartDate?.date);
  const end = parseDate(item.timeframe?.contextualEndDate?.date);

  if (!start && !end) {
    return (
      <span className="absolute top-3 text-xs text-content-dimmed" style={{ left: viewport.left + 10 }}>
        {t("No dates")}
      </span>
    );
  }

  if (!start && end) {
    const x = positionOf(end);
    if (x < viewport.left || x >= viewport.right) return null;
    const labelOnLeft = viewport.right - x < 96 && x - viewport.left > viewport.right - x;

    return (
      <span className="absolute top-3 text-xs" style={{ left: x }}>
        <span className="text-indigo-600 dark:text-indigo-300">◆</span>
        <span className={`absolute top-0 whitespace-nowrap ${labelOnLeft ? "right-full mr-1" : "left-full ml-1"}`}>
          {t("Due {{date}}", { date: formatMarkDate(end, locale) })}
        </span>
      </span>
    );
  }

  if (!start) return null;

  const layout = barLayout(start, end, positionOf, viewport);
  if (!layout) return null;

  if (item.type === "goal") {
    return <GoalBar start={start} end={end} layout={layout} locale={locale} />;
  }

  return <ProjectBar item={item} layout={layout} positionOf={positionOf} />;
}

/** Clips the bar to the visible viewport. Returns null when the bar is entirely off-screen. */
function barLayout(
  start: Date,
  end: Date | null,
  positionOf: (date: Date) => number,
  viewport: Viewport,
): BarLayout | null {
  const barStart = positionOf(start);
  const barEnd = end ? positionOf(addDays(end, 1)) : viewport.right;
  const left = Math.max(viewport.left, barStart);
  const right = Math.min(viewport.right, barEnd);
  if (right <= left) return null;

  return {
    bounds: { left, width: right - left },
    startsBeforeView: barStart < viewport.left,
    endsAfterView: barEnd > viewport.right,
  };
}

function GoalBar({ start, end, layout, locale }: { start: Date; end: Date | null; layout: BarLayout; locale: string }) {
  const { bounds, startsBeforeView, endsAfterView } = layout;

  return (
    <div
      className="absolute top-1.5 flex h-6 justify-between overflow-hidden whitespace-nowrap border-b-2 border-[#cf8872] px-1 text-[11px] text-orange-800 dark:text-[#efae97]"
      style={bounds}
    >
      <span>
        {startsBeforeView && "← "}
        {formatMarkDate(start, locale, { includeYear: startsBeforeView })}
      </span>
      <span>
        {end && formatMarkDate(end, locale, { includeYear: endsAfterView })}
        {endsAfterView && " →"}
      </span>
    </div>
  );
}

function ProjectBar({
  item,
  layout,
  positionOf,
}: {
  item: WorkMapV2Item;
  layout: BarLayout;
  positionOf: (date: Date) => number;
}) {
  const { bounds, startsBeforeView, endsAfterView } = layout;
  const milestones = visibleMilestones(item, bounds, positionOf);
  const firstMilestone = milestones[0];

  return (
    <div
      className={`absolute top-2 h-6 overflow-hidden rounded border-l-[3px] px-2 py-1 text-[11px] ${projectStatusColors(item.status)}`}
      style={bounds}
    >
      <span className="block truncate" style={{ maxWidth: firstMilestone && Math.max(0, firstMilestone.x - 12) }}>
        {startsBeforeView && "← "}
        {item.name}
        {endsAfterView && " →"}
      </span>

      {milestones.map((milestone, i) => {
        const nextX = milestones[i + 1]?.x ?? bounds.width;

        return (
          <span
            key={milestone.id}
            title={milestone.title}
            className="absolute top-1 truncate"
            style={{ left: milestone.x, maxWidth: nextX - milestone.x }}
          >
            ◆ {milestone.title}
          </span>
        );
      })}
    </div>
  );
}

/** Milestones inside the bar, with `x` relative to the bar's left edge, sorted left to right. */
function visibleMilestones(item: WorkMapV2Item, bounds: BarLayout["bounds"], positionOf: (date: Date) => number) {
  return (item.milestones ?? [])
    .flatMap((milestone) => {
      const due = parseDate(milestone.timeframe?.contextualEndDate?.date);
      if (!due) return [];

      const x = positionOf(due) - bounds.left;
      const insideBar = x >= 0 && x < bounds.width;
      return insideBar ? [{ id: milestone.id, title: milestone.title, x }] : [];
    })
    .sort((a, b) => a.x - b.x);
}

function projectStatusColors(status: WorkMapV2Item["status"]) {
  switch (status) {
    case "caution":
      return "border-amber-400 bg-amber-100 text-amber-900 dark:bg-[#493c29] dark:text-[#f7c975]";
    case "off_track":
      return "border-red-400 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200";
    default:
      return "border-blue-400 bg-blue-100 text-blue-900 dark:bg-[#303d59] dark:text-[#b4c7ff]";
  }
}
