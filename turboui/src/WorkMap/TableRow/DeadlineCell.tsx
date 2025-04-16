import { WorkMap } from "..";
import { useItemStatus } from "../hooks/useItemStatus";
import classNames from "../../utils/classnames";

interface Props {
  filter: WorkMap.Filter;
  completedOn?: string;
  deadline?: WorkMap.Item['deadline'];
  status: WorkMap.Status;
}

export function DeadlineCell({ filter, completedOn, deadline, status }: Props) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);

  const containerClassName = classNames(
    "py-2 px-2 md:px-4",
    filter !== "completed" && "hidden lg:table-cell"
  );
  const textClassName = classNames("text-sm whitespace-nowrap", {
    "text-red-600":
      deadline?.isPast && !isCompleted && !isFailed && !isDropped && !isPending,
    "text-content-base": !(
      deadline?.isPast &&
      !isCompleted &&
      !isFailed &&
      !isDropped &&
      !isPending
    ),
    "line-through text-content-dimmed": isCompleted || isFailed,
    "line-through opacity-70 text-content-dimmed": isDropped,
    "text-content-dimmed": isPending,
  });

  return (
    <td className={containerClassName}>
      {filter === "completed" && completedOn ? (
        <span className="text-xs sm:text-sm whitespace-nowrap text-content-base">
          {completedOn}
        </span>
      ) : (
        <span className={textClassName}>{deadline?.display}</span>
      )}
    </td>
  );
}
