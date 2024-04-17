import * as Time from "@/utils/time";

const YEAR_REGEX = /^\d{4}$/;
const QUARTER_REGEX = /^Q[1-4] \d{4}$/;

const quarters = {
  Q1: { start: "01-01", end: "03-31" },
  Q2: { start: "04-01", end: "06-30" },
  Q3: { start: "07-01", end: "09-30" },
  Q4: { start: "10-01", end: "12-31" },
};

export class Timeframe {
  static parse(timeframe: string): Timeframe {
    if (timeframe.match(YEAR_REGEX)) {
      return new Timeframe(Time.parse(`${timeframe}-01-01`)!, Time.parse(`${timeframe}-12-31`)!);
    }

    if (timeframe.match(QUARTER_REGEX)) {
      const quarter = quarters[timeframe.slice(0, 2)];

      return new Timeframe(
        Time.parseISO(`${timeframe.slice(3)}-${quarter.start}`),
        Time.parseISO(`${timeframe.slice(3)}-${quarter.end}`),
      );
    }

    throw new Error(`Invalid timeframe: ${timeframe}`);
  }

  constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {}

  isOverdue(): boolean {
    return !Time.isToday(this.end) && Time.isPast(this.end);
  }

  remainingDays(): number {
    if (this.isOverdue()) {
      return 0;
    }

    return Time.daysBetween(Time.today(), this.end);
  }

  overdueDays(): number {
    if (this.isOverdue()) {
      return Time.daysBetween(this.end, Time.today());
    }

    return 0;
  }
}
