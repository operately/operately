import React from "react";
import { ProgressBar, ProgressBarStatus, Tooltip } from "../../..";
import { WorkMap } from "..";
import { useItemStatus } from "../../hooks/useItemStatus";
import { GoalProgressSummary } from "./GoalProgressSummary";

interface ProgressCellProps {
  item: WorkMap.Item;
  hide?: boolean;
}

export function ProgressCell({ item, hide }: ProgressCellProps) {
  const { isCompleted } = useItemStatus(item.status);

  if (hide) return null;

  if (isCompleted) {
    return <td className="py-2 px-2 pr-4 md:px-4"></td>;
  }

  const progressBar = (
    <div className="transform group-hover:scale-[1.02] transition-transform duration-150 w-[70px]">
      <ProgressBar progress={item.progress ?? 0} status={item.status as ProgressBarStatus} />
    </div>
  );

  return (
    <td className="py-2 px-2 pr-6 lg:px-4 ">
      {item.type === "goal" ? (
        <Tooltip
          content={<GoalProgressSummary targets={item.targets} checklist={item.checklist} />}
          size="sm"
          className="!font-normal"
          testId="goal-progress-summary"
        >
          {progressBar}
        </Tooltip>
      ) : (
        progressBar
      )}
    </td>
  );
}
