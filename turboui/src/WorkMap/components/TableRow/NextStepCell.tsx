import React from "react";
import { WorkMap } from "..";
import { useItemStatus } from "../../hooks/useItemStatus";
import classNames from "../../../utils/classnames";

interface Props {
  nextStep: WorkMap.Item["nextStep"];
  status: WorkMap.Item["status"];
  hide?: boolean;
}

export function NextStepCell({ nextStep, status, hide }: Props) {
  const { isCompleted, isFailed, isPending } = useItemStatus(status);
  const isClosed = isCompleted || isFailed;

  const className = classNames(
    "text-sm transition-colors duration-150",
    "text-content-base group-hover:text-content-intense",
    isPending && "text-content-dimmed",
  );

  if (hide) return null;

  if (isClosed) return <td />;

  return (
    <td className="py-2 px-2 md:px-4 hidden xl:table-cell">
      <div className="w-full xl:max-w-[200px] 2xl:max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
        <span title={nextStep || ""} className={className}>
          {nextStep}
        </span>
      </div>
    </td>
  );
}
