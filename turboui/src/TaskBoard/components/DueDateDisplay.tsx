import React from "react";

interface DueDateDisplayProps {
  dueDate: Date;
}

export function DueDateDisplay({ dueDate }: DueDateDisplayProps) {
  const isOverdue = dueDate < new Date();
  const formattedDate = dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return <span className={`text-xs ${isOverdue ? "text-red-500" : "text-content-dimmed"}`}>{formattedDate}</span>;
}
