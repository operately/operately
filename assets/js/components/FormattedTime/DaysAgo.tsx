import React from "react";
import * as Time from "@/utils/time";

// Returns a string like "Today", "Yesterday", "3d ago", etc.
export function DaysAgo({ date, className }: { date: string; className?: string }) {
  const parsed = Time.parse(date);

  if (!parsed) throw new Error(`Invalid date: ${date}`);

  const diff = Time.daysBetween(parsed, Time.today());

  let value = "";

  if (diff <= 0) {
    value = "Today";
  } else if (diff === 1) {
    value = "Yesterday";
  } else {
    value = `${diff}d ago`;
  }

  return <span className={className}>{value}</span>;
}
