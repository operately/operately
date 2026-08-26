import { timeAxisTicks } from "./timeAxis";

// Local-time constructor: the axis labels calendar days, so a UTC-parsed string
// would shift the expected labels depending on the machine's timezone. Callers
// that receive backend `:date` values as `YYYY-MM-DD` must parse them with
// `fromIsoDate` (local midnight), not `new Date(iso)`.
function at(year: number, month: number, day: number, hour = 0): Date {
  return new Date(year, month - 1, day, hour);
}

function labels(from: Date, to: Date, maxTicks?: number): string[] {
  return timeAxisTicks(from, to, maxTicks).map((tick) => tick.label);
}

describe("timeAxisTicks", () => {
  test("labels days for a range of a couple of weeks", () => {
    expect(labels(at(2026, 3, 2), at(2026, 3, 14))).toEqual(["Mar 2, 2026", "Mar 5", "Mar 8", "Mar 11", "Mar 14"]);
  });

  // Inside a single year the year is named once and never repeated: it would
  // say nothing the first label has not already said.
  test("labels months for a range of about a year", () => {
    expect(labels(at(2026, 1, 15), at(2026, 12, 20))).toEqual(["Mar 2026", "May", "Jul", "Sep", "Nov"]);
  });

  test("keeps month ticks on calendar quarters", () => {
    expect(labels(at(2025, 2, 10), at(2026, 6, 30))).toEqual([
      "Apr 2025",
      "Jul 2025",
      "Oct 2025",
      "Jan 2026",
      "Apr 2026",
    ]);
  });

  test("labels years for a range of many years", () => {
    expect(labels(at(2013, 5, 1), at(2026, 5, 1))).toEqual(["2015", "2020", "2025"]);
  });

  test("names the year on every tick when the range crosses years", () => {
    expect(labels(at(2024, 3, 1), at(2026, 8, 15))).toEqual([
      "Jul 2024",
      "Jan 2025",
      "Jul 2025",
      "Jan 2026",
      "Jul 2026",
    ]);
  });

  test("names the year only where it changes once the axis is dense", () => {
    expect(labels(at(2024, 3, 1), at(2026, 8, 15), 12)).toEqual([
      "Apr 2024",
      "Jul",
      "Oct",
      "Jan 2025",
      "Apr",
      "Jul",
      "Oct",
      "Jan 2026",
      "Apr",
      "Jul",
    ]);
  });

  test("never returns more ticks than the chart has room for", () => {
    const ranges: [Date, Date][] = [
      [at(2026, 3, 1), at(2026, 3, 8)],
      [at(2026, 1, 1), at(2026, 4, 1)],
      [at(2024, 1, 1), at(2026, 8, 15)],
      [at(1998, 1, 1), at(2026, 8, 15)],
    ];

    ranges.forEach(([from, to]) => {
      expect(labels(from, to).length).toBeLessThanOrEqual(6);
    });
  });

  test("labels the day when the whole range sits inside it", () => {
    expect(labels(at(2026, 3, 2, 9), at(2026, 3, 2, 17))).toEqual(["Mar 2, 2026"]);
  });

  test("labels a single point when the range has no span", () => {
    expect(labels(at(2026, 3, 2), at(2026, 3, 2))).toEqual(["Mar 2, 2026"]);
  });

  test("returns ticks inside the requested range, in order", () => {
    const from = at(2024, 3, 1);
    const to = at(2026, 8, 15);
    const ticks = timeAxisTicks(from, to);

    ticks.forEach((tick) => {
      expect(tick.time).toBeGreaterThanOrEqual(from.getTime());
      expect(tick.time).toBeLessThanOrEqual(to.getTime());
    });

    const times = ticks.map((tick) => tick.time);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
