import * as Time from "../utils/time";

export default function ShortDate({ time, weekday }: { time: Date; weekday: boolean }) {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  if (!Time.isCurrentYear(time)) {
    options.year = "numeric";
  }

  let prefix = "";

  if (weekday) {
    if (Time.isToday(time)) {
      prefix = "Today, ";
    } else if (Time.isYesterday(time)) {
      prefix = "Yesterday, ";
    } else {
      options.weekday = "long";
    }
  }

  return <>{prefix + time.toLocaleDateString("en-US", options)}</>;
}
