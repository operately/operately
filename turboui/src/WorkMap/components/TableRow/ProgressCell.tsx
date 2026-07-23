import React from "react";
import { ProgressBar, ProgressBarStatus, Tooltip } from "../../..";
import { WorkMap } from "..";
import { useItemStatus } from "../../hooks/useItemStatus";
import { GoalProgressSummary } from "./GoalProgressSummary";
import { ProjectProgressSummary } from "./ProjectProgressSummary";

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

  const summary = progressSummaryFor(item);

  return (
    <td className="py-2 px-2 pr-6 lg:px-4 ">
      {summary ? (
        <Tooltip content={summary.content} size="sm" className="!font-normal" testId={summary.testId}>
          {progressBar}
        </Tooltip>
      ) : (
        progressBar
      )}
    </td>
  );
}

function progressSummaryFor(item: WorkMap.Item): { content: React.ReactNode; testId: string } | null {
  if (item.type === "goal") {
    return {
      content: <GoalProgressSummary targets={item.targets} checklist={item.checklist} />,
      testId: "goal-progress-summary",
    };
  }

  if (item.type === "project") {
    return {
      content: <ProjectProgressSummary milestones={item.milestones} />,
      testId: "project-progress-summary",
    };
  }

  return null;
}
