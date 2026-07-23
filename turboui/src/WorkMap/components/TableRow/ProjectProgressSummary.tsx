import React from "react";

import { IconFlag, IconFlagFilled } from "../../../icons";
import { PieChart } from "../../../PieChart";
import classNames from "../../../utils/classnames";
import { WorkMap } from "..";

interface ProjectProgressSummaryProps {
  milestones: WorkMap.Milestone[];
}

export function ProjectProgressSummary({ milestones }: ProjectProgressSummaryProps) {
  if (milestones.length === 0) {
    return (
      <div className="text-content-dimmed text-xs font-normal" data-testid="project-progress-summary-content">
        No milestones
      </div>
    );
  }

  const completedCount = milestones.filter((milestone) => milestone.status === "done").length;
  const totalCount = milestones.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div
      className="flex flex-col gap-1.5 min-w-[220px] max-w-[320px] font-normal"
      data-testid="project-progress-summary-content"
    >
      <div className="flex items-center gap-2 mb-0.5">
        <div className="text-xs font-semibold text-content-dimmed uppercase tracking-wide">Milestones</div>
        <div className="flex items-center gap-1.5 text-xs text-content-subtle">
          <PieChart size={12} slices={[{ percentage: completionPercentage, color: "var(--color-green-500)" }]} />
          <span>
            {completedCount}/{totalCount} completed ({completionPercentage}%)
          </span>
        </div>
      </div>

      {milestones.map((milestone) => (
        <MilestoneRow key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}

function MilestoneRow({ milestone }: { milestone: WorkMap.Milestone }) {
  const isDone = milestone.status === "done";
  const nameClass = classNames("text-sm truncate", {
    "line-through text-content-dimmed": isDone,
    "text-content-accent": !isDone,
  });

  return (
    <div className="flex items-center gap-2 min-w-0">
      {isDone ? (
        <IconFlagFilled size={14} className="text-accent-1 flex-shrink-0" />
      ) : (
        <IconFlag size={14} className="text-content-subtle flex-shrink-0" />
      )}
      <span className={nameClass}>{milestone.name}</span>
    </div>
  );
}
