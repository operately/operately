// Formats a date as "Mon 1st", "Apr 2nd", etc. for UI display.
// Adds the correct English ordinal suffix to the day (st, nd, rd, th).
// Example: formatDateWithDaySuffix(new Date(2025, 3, 17)) => "Apr 17th"
// Intended for concise, human-friendly date display in check-ins, feeds, etc.
export function formatDateWithDaySuffix(date: Date) {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const formatted = date.toLocaleDateString("en-US", options);
  const day = date.getDate();
  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";
  return formatted.replace(/\d+/, day + suffix);
}