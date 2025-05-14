import React from "react";
import { IconCalendar } from "@tabler/icons-react";

interface DueDateDisplayProps {
  dueDate: Date;
}

export function DueDateDisplay({ dueDate }: DueDateDisplayProps) {
  const isOverdue = dueDate < new Date();
  const formattedDate = dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-content-dimmed"}`}>
      <IconCalendar size={14} />
      <span>{formattedDate}</span>
    </span>
  );
}
