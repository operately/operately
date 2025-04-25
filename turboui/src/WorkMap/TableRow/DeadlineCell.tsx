import { useMemo } from "react";
import { isPast, parseISO, parse, format } from "date-fns";

import { WorkMap } from "..";
import { useItemStatus } from "../hooks/useItemStatus";
import classNames from "../../utils/classnames";

interface Props {
  filter: WorkMap.Filter;
  completedOn: WorkMap.Item["completedOn"];
  timeframe: WorkMap.Item["timeframe"];
  status: WorkMap.Status;
}

interface DateInfo {
  display: string;
  isPast: boolean;
}

export function DeadlineCell({ filter, status, completedOn, timeframe }: Props) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);

  const containerClassName = classNames("py-2 px-2 md:px-4", filter !== "completed" && "hidden lg:table-cell");
  const dateInfo = useMemo(() => parseDeadline(timeframe?.endDate), [timeframe]);

  const textClassName = classNames("text-sm whitespace-nowrap", {
    "text-red-600": dateInfo?.isPast && !isCompleted && !isFailed && !isDropped && !isPending,
    "text-content-base": !(dateInfo?.isPast && !isCompleted && !isFailed && !isDropped && !isPending),
    "line-through text-content-dimmed": isCompleted || isFailed,
    "line-through opacity-70 text-content-dimmed": isDropped,
    "text-content-dimmed": isPending,
  });

  return (
    <td className={containerClassName}>
      {filter === "completed" && completedOn ? (
        <span className="text-xs sm:text-sm whitespace-nowrap text-content-base">{completedOn}</span>
      ) : (
        <span className={textClassName}>{dateInfo?.display}</span>
      )}
    </td>
  );
}

function parseDeadline(deadline: string | null | undefined): DateInfo | null {
  if (!deadline) return null;

  try {
    let date;
    let display = deadline; // Default to the original string

    // Try parsing as ISO first
    try {
      date = parseISO(deadline);
      if (!isNaN(date.getTime())) {
        display = format(date, "MMM d yyyy");
      }
    } catch {
      if (deadline.includes(" ") && deadline.length > 7) {
        // Already in display format: "Dec 31 2025"
        date = parse(deadline, "MMM d yyyy", new Date());
      } else {
        // Already in display format: "Mar 31"
        date = parse(deadline, "MMM d", new Date());
      }
    }

    return {
      display,
      isPast: isPast(date),
    };
  } catch (error) {
    console.error("Error parsing deadline date:", error);
    return {
      display: deadline,
      isPast: false,
    };
  }
}
