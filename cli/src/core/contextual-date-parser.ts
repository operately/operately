export interface ContextualDateResult {
  date_type: "day" | "month" | "quarter" | "year";
  value: string;
  date: string;
}

export function parseContextualDateString(value: string): ContextualDateResult {
  // Try ISO date format first (YYYY-MM-DD)
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new Error("Invalid ISO date");
    }

    return {
      date_type: "day",
      value: formatDayDateValue({ year, month, day }),
      date: value,
    };
  }

  // Try year format (YYYY or YYYY^)
  const yearMatch = /^(\d{4})(\^)?$/.exec(value);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    const isStart = yearMatch[2] === "^";
    const date = isStart ? `${year}-01-01` : `${year}-12-31`;

    return {
      date_type: "year",
      value: String(year),
      date,
    };
  }

  // Try quarter format (YYYY/q# or YYYY/q#^)
  const quarterMatch = /^(\d{4})\/q([1-4])(\^)?$/i.exec(value);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    const isStart = quarterMatch[3] === "^";

    const quarterStartMonths = [1, 4, 7, 10];
    const quarterEndMonths = [3, 6, 9, 12];

    const month = isStart ? quarterStartMonths[quarter - 1] : quarterEndMonths[quarter - 1];
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const day = isStart ? 1 : lastDayOfMonth;

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return {
      date_type: "quarter",
      value: `Q${quarter} ${year}`,
      date: dateStr,
    };
  }

  // Try month format (YYYY/MM or YYYY/MM^)
  const monthMatch = /^(\d{4})\/(\d{2})(\^)?$/.exec(value);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const isStart = monthMatch[3] === "^";

    if (month < 1 || month > 12) {
      throw new Error("Invalid month");
    }

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const day = isStart ? 1 : lastDayOfMonth;

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short" });

    return {
      date_type: "month",
      value: `${monthName} ${year}`,
      date: dateStr,
    };
  }

  throw new Error("Unrecognized format");
}

function formatDayDateValue(date: { year: number; month: number; day: number }): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.month - 1]} ${date.day}, ${date.year}`;
}
