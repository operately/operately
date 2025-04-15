import { Status } from "../types";
import { useItemStatus } from "./hooks/useItemStatus";
import classNames from "../../utils/classnames";

interface Props {
  nextStep: string;
  status: Status;
}

export function NextStepCell({ nextStep, status }: Props) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);

  const className = classNames(
    "text-sm transition-colors duration-150",
    isCompleted || isFailed
      ? "line-through text-content-dimmed"
      : "text-content-base group-hover:text-content-intense",
    isDropped && "line-through opacity-70 text-content-dimmed",
    isPending && "text-content-dimmed"
  );

  return (
    <td className="py-2 px-2 md:px-4 hidden xl:table-cell">
      <div className="w-full xl:max-w-[200px] 2xl:max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
        <span title={nextStep} className={className}>
          {nextStep}
        </span>
      </div>
    </td>
  );
}
