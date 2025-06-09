import React from "react";
import { useMemo } from "react";
import { isPast, parse } from "../../../utils/time";

import { WorkMap } from "..";
import { useItemStatus } from "../../hooks/useItemStatus";
import classNames from "../../../utils/classnames";
import FormattedTime from "../../../FormattedTime";

interface Props {
  tab: WorkMap.Filter;
  completedOn: WorkMap.Item["completedOn"];
  timeframe: WorkMap.Item["timeframe"];
  status: WorkMap.Item["status"];
  hide?: boolean;
}

export function DueDateCell({ tab, status, completedOn, timeframe, hide }: Props) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);

  if (hide) return null;

  const containerClassName = classNames("py-2 px-2 md:px-4", tab !== "completed" && "hidden lg:table-cell");
  const isPastDueDate = useMemo(() => isDueDatePast(timeframe?.endDate), [timeframe]);

  const textClassName = classNames("text-sm whitespace-nowrap", {
    "text-content-error": isPastDueDate && !isCompleted && !isFailed && !isDropped && !isPending,
    "text-content-base": !(isPastDueDate && !isCompleted && !isFailed && !isDropped && !isPending),
    "line-through text-content-dimmed": isCompleted || isFailed,
    "line-through opacity-70 text-content-dimmed": isDropped,
    "text-content-dimmed": isPending,
  });

  return (
    <td className={containerClassName}>
      {tab === "completed" && completedOn ? (
        <span className="text-xs sm:text-sm whitespace-nowrap text-content-base">
          <FormattedTime time={completedOn} format="short-date" />
        </span>
      ) : (
        <span className={textClassName}>
          {timeframe?.endDate ? <FormattedTime time={timeframe.endDate} format="short-date" /> : "N/A"}
        </span>
      )}
    </td>
  );
}

function isDueDatePast(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;

  try {
    const date = parse(dueDate);
    if (!date) return false;

    return isPast(date);
  } catch (error) {
    console.error("Error checking if due date is past:", error);
    return false;
  }
}
