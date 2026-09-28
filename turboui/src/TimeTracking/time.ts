import { addDays, format, parseISO } from "date-fns";
import { formatNumber } from "../utils/formatting";
import { dateInTimezone, zonedDateTimeToDate } from "../utils/timezone";

export function parseDuration(input: string): number | null {
  const value = input.trim().toLowerCase();
  let seconds: number;
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    seconds = Number(value) * 60;
  } else if (/^\d+:[0-5]\d$/.test(value)) {
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    seconds = hours * 3600 + minutes * 60;
  } else {
    const match = /^(?:(\d+(?:\.\d+)?)h)?\s*(?:(\d+(?:\.\d+)?)m)?\s*(?:(\d+)s)?$/.exec(value);
    if (!match || !value) return null;
    seconds = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  }
  return Number.isSafeInteger(Math.round(seconds)) && seconds > 0 ? Math.max(1, Math.round(seconds)) : null;
}

export function durationInput(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours && `${hours}h`, minutes && `${minutes}m`, remainder && `${remainder}s`].filter(Boolean).join(" ");
}

export function formatDuration(seconds: number, locale: string, showSeconds = false): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const parts: string[] = [];
  const unit = (value: number, name: string) =>
    formatNumber(value, locale, { style: "unit", unit: name, unitDisplay: "narrow" });
  if (hours) parts.push(unit(hours, "hour"));
  if (minutes) parts.push(unit(minutes, "minute"));
  if (showSeconds || (total > 0 && total < 60)) parts.push(unit(total % 60, "second"));
  return parts.join(" ") || unit(0, "minute");
}

export function dateKey(date: Date, timezone: string): string {
  return format(dateInTimezone(date, timezone), "yyyy-MM-dd");
}

export function shiftDate(date: string, days: number): string {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

export function clockInterval(input: { date: string; endDate: string; start: string; end: string; timezone: string }) {
  const convert = (date: string, time: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
    const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
    const [hour = 0, minute = 0] = time.split(":").map(Number);
    return zonedDateTimeToDate({ year, month, day, hour, minute }, input.timezone);
  };
  const start = convert(input.date, input.start);
  const end = convert(input.endDate, input.end);
  if (!start || !end || end <= start) return null;
  return {
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    durationSeconds: (end.getTime() - start.getTime()) / 1000,
  };
}
