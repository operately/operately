// Date labels for a chart's horizontal axis.
//
// Labelling only the first and last point tells a reader when a series starts
// and ends but nothing about what lies between, so a line covering two years
// reads the same as one covering two weeks. These ticks instead sit on calendar
// boundaries the reader already thinks in — days, months, quarters, years — at
// the finest spacing that still fits, so the shape of the line can be read
// against real dates.
//
// Ticks are computed in local calendar time. Date-only API values must be
// parsed with `fromIsoDate`; `new Date("YYYY-MM-DD")` is UTC midnight and would
// land on the previous day in negative-offset timezones.

export interface TimeAxisTick {
  time: number;
  label: string;
}

type Granularity = "day" | "month" | "year";

interface Spacing {
  granularity: Granularity;
  step: number;
}

// Ordered coarse to fine: the finest spacing that fits wins, so a short range
// gets days and a long one gets years without the caller choosing.
const SPACINGS: Spacing[] = [
  { granularity: "year", step: 10 },
  { granularity: "year", step: 5 },
  { granularity: "year", step: 2 },
  { granularity: "year", step: 1 },
  { granularity: "month", step: 6 },
  { granularity: "month", step: 3 },
  { granularity: "month", step: 2 },
  { granularity: "month", step: 1 },
  { granularity: "day", step: 14 },
  { granularity: "day", step: 7 },
  { granularity: "day", step: 3 },
  { granularity: "day", step: 2 },
  { granularity: "day", step: 1 },
];

// Labels carrying a year need roughly a sixth of the chart's width, so more than
// this many would crowd into each other.
const MAX_TICKS = 6;

// While the labels stay this far apart, every one of them names its year: a
// lone "Jul" between two years is something the reader has to work out from a
// neighbouring label. Denser axes drop the repetition to stay legible.
const MAX_TICKS_WITH_REPEATED_YEAR = 6;

export function timeAxisTicks(from: Date, to: Date, maxTicks: number = MAX_TICKS): TimeAxisTick[] {
  const start = from.getTime();
  const end = to.getTime();

  if (end <= start) return label([new Date(start)], "day");

  const fitted = fit(start, end, maxTicks);
  if (fitted) return label(fitted.dates, fitted.spacing.granularity);

  // Nothing lands inside the range: it is shorter than a day, or so long that
  // even decades would crowd. Its endpoints still say what it covers.
  return label(distinctDays(start, end), "day");
}

// The finest spacing whose boundaries both fit the width and give at least two
// dates, since a single tick says no more than an endpoint label would.
function fit(start: number, end: number, maxTicks: number): { spacing: Spacing; dates: Date[] } | null {
  let fitted: { spacing: Spacing; dates: Date[] } | null = null;

  for (const spacing of SPACINGS) {
    const dates = boundaries(start, end, spacing);
    if (dates.length > maxTicks) break;
    if (dates.length >= 2) fitted = { spacing, dates };
  }

  return fitted;
}

function boundaries(start: number, end: number, spacing: Spacing): Date[] {
  const dates: Date[] = [];

  for (let cursor = firstBoundary(start, spacing); cursor.getTime() <= end; cursor = advance(cursor, spacing)) {
    dates.push(cursor);
  }

  return dates;
}

function firstBoundary(start: number, spacing: Spacing): Date {
  const date = new Date(start);

  if (spacing.granularity === "year") {
    const aligned = Math.ceil(date.getFullYear() / spacing.step) * spacing.step;
    const boundary = new Date(aligned, 0, 1);
    return boundary.getTime() >= start ? boundary : new Date(aligned + spacing.step, 0, 1);
  }

  if (spacing.granularity === "month") {
    // Counted from January so a 3-month step lands on calendar quarters rather
    // than on whichever month the data happens to begin in.
    const boundary = new Date(date.getFullYear(), 0, 1);
    while (boundary.getTime() < start) boundary.setMonth(boundary.getMonth() + spacing.step);
    return boundary;
  }

  // Days have no equivalent anchor, so they are counted from the range's own start.
  const boundary = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (boundary.getTime() < start) boundary.setDate(boundary.getDate() + 1);
  return boundary;
}

function advance(date: Date, spacing: Spacing): Date {
  const next = new Date(date);

  if (spacing.granularity === "year") next.setFullYear(next.getFullYear() + spacing.step);
  else if (spacing.granularity === "month") next.setMonth(next.getMonth() + spacing.step);
  else next.setDate(next.getDate() + spacing.step);

  return next;
}

function distinctDays(start: number, end: number): Date[] {
  const first = new Date(start);
  const last = new Date(end);

  return isSameDay(first, last) ? [first] : [first, last];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// An axis staying inside one calendar year names it once, on the first tick,
// since repeating it would say nothing. One crossing years names it on every
// tick it has room for, and otherwise wherever the year turns.
function label(dates: Date[], granularity: Granularity): TimeAxisTick[] {
  const crossesYears = dates.length > 0 && dates[0]!.getFullYear() !== dates[dates.length - 1]!.getFullYear();
  const repeatYear = crossesYears && dates.length <= MAX_TICKS_WITH_REPEATED_YEAR;

  return dates.map((date, index) => {
    const previous = dates[index - 1];
    const withYear = repeatYear || !previous || previous.getFullYear() !== date.getFullYear();

    return { time: date.getTime(), label: formatTick(date, granularity, withYear) };
  });
}

function formatTick(date: Date, granularity: Granularity, withYear: boolean): string {
  const year: Intl.DateTimeFormatOptions = withYear ? { year: "numeric" } : {};

  if (granularity === "year") return date.toLocaleDateString(undefined, { year: "numeric" });
  if (granularity === "month") return date.toLocaleDateString(undefined, { month: "short", ...year });

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", ...year });
}
