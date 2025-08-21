import React, { useMemo } from "react";
import { isPast, isToday } from "../../../utils/time";

import { WorkMap } from "..";
import { DateField } from "../../../DateField";
import FormattedTime from "../../../FormattedTime";
import classNames from "../../../utils/classnames";
import { useItemStatus } from "../../hooks/useItemStatus";

interface Props {
  tab: WorkMap.Filter;
  completedOn: WorkMap.Item["completedOn"];
  timeframe: WorkMap.Item["timeframe"];
  status: WorkMap.Item["status"];
  hide?: boolean;
}

export function DueDateCell({ tab, status, completedOn, timeframe, hide }: Props) {
  const { isCompleted, isFailed, isPending } = useItemStatus(status);

  if (hide) return null;

  const containerClassName = classNames("py-2 px-2 md:px-4", tab !== "completed" && "hidden lg:table-cell");
  const isPastDueDate = useMemo(() => isDueDatePast(timeframe?.endDate), [timeframe]);

  const textClassName = classNames("text-sm whitespace-nowrap", {
    "text-content-error": isPastDueDate && !isCompleted && !isFailed && !isPending,
    "text-content-base": !(isPastDueDate && !isCompleted && !isFailed && !isPending),
    "line-through text-content-dimmed": isCompleted || isFailed,
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
          <DateField date={timeframe?.endDate} readonly hideCalendarIcon placeholder="N/A" />
        </span>
      )}
    </td>
  );
}

function isDueDatePast(dueDate: DateField.ContextualDate | null | undefined): boolean {
  if (!dueDate) return false;

  try {
    const { date } = dueDate;
    if (!date) return false;

    return !isToday(date) && isPast(date);
  } catch (error) {
    console.error("Error checking if due date is past:", error);
    return false;
  }
}
