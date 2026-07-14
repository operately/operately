export interface WallClockDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
}

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function dateInTimezone(date: Date, timezone: string): Date {
  const parts = dateTimePartsInTimezone(date, timezone);

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    date.getMilliseconds(),
  );
}

export function zonedDateTimeToDate(wallClock: WallClockDateTime, timezone: string): Date | null {
  const normalizedWallClock = { ...wallClock, second: wallClock.second ?? 0 };
  const utcGuess = Date.UTC(
    normalizedWallClock.year,
    normalizedWallClock.month - 1,
    normalizedWallClock.day,
    normalizedWallClock.hour,
    normalizedWallClock.minute,
    normalizedWallClock.second,
  );

  let candidate = new Date(utcGuess - timezoneOffsetAt(new Date(utcGuess), timezone));

  for (let attempt = 0; attempt < 3; attempt++) {
    const adjustedCandidate = new Date(utcGuess - timezoneOffsetAt(candidate, timezone));
    if (adjustedCandidate.getTime() === candidate.getTime()) break;
    candidate = adjustedCandidate;
  }

  const candidateWallClock = dateTimePartsInTimezone(candidate, timezone);
  return dateTimePartsMatch(candidateWallClock, normalizedWallClock) ? candidate : null;
}

function timezoneOffsetAt(date: Date, timezone: string): number {
  const parts = dateTimePartsInTimezone(date, timezone);
  const timeInTargetTimezone = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const instantWithoutMilliseconds = date.getTime() - date.getMilliseconds();

  return timeInTargetTimezone - instantWithoutMilliseconds;
}

function dateTimePartsInTimezone(date: Date, timezone: string): DateTimeParts {
  // Locale and numbering are fixed because these parts are machine-read and never displayed.
  const formattedParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const parts: DateTimeParts = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 };

  for (const part of formattedParts) {
    const value = Number(part.value);

    switch (part.type) {
      case "year":
        parts.year = value;
        break;
      case "month":
        parts.month = value;
        break;
      case "day":
        parts.day = value;
        break;
      case "hour":
        parts.hour = value;
        break;
      case "minute":
        parts.minute = value;
        break;
      case "second":
        parts.second = value;
        break;
    }
  }

  if (!parts.year || !parts.month || !parts.day) {
    throw new Error(`Could not determine the date and time in timezone ${timezone}`);
  }

  return parts;
}

function dateTimePartsMatch(actual: DateTimeParts, expected: Required<WallClockDateTime>): boolean {
  return (
    actual.year === expected.year &&
    actual.month === expected.month &&
    actual.day === expected.day &&
    actual.hour === expected.hour &&
    actual.minute === expected.minute &&
    actual.second === expected.second
  );
}
