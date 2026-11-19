import React from "react";
import { useTranslation } from "react-i18next";

import { IconFlag, IconFlagFilled } from "../../../icons";
import { PieChart } from "../../../PieChart";
import classNames from "../../../utils/classnames";
import { WorkMap } from "..";

interface ProjectProgressSummaryProps {
  milestones: WorkMap.Milestone[];
  taskCompletion?: WorkMap.Item["taskCompletion"];
}

export function ProjectProgressSummary({ milestones, taskCompletion }: ProjectProgressSummaryProps) {
  const { t } = useTranslation();

  const completedCount = milestones.filter((milestone) => milestone.status === "done").length;
  const totalCount = milestones.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className="flex flex-col gap-1.5 min-w-[220px] max-w-[320px] font-normal"
      data-testid="project-progress-summary-content"
    >
      <div className="text-xs font-semibold text-content-dimmed uppercase tracking-wide">{t("Task completion")}</div>
      <div className="flex items-center gap-1.5 text-xs text-content-subtle mb-2" data-testid="task-completion-summary">
        {taskCompletion ? (
          <>
            <PieChart size={12} slices={[{ percentage: taskCompletion.percentage, color: "var(--color-green-500)" }]} />
            <span>
              {t("{{completed}}/{{total}} completed ({{percentage}}%)", {
                completed: taskCompletion.completedCount,
                total: taskCompletion.totalCount,
                percentage: taskCompletion.percentage,
              })}
            </span>
          </>
        ) : (
          t("No tracked tasks")
        )}
      </div>
      <div className="flex items-center gap-2 mb-0.5">
        <div className="text-xs font-semibold text-content-dimmed uppercase tracking-wide">{t("Milestones")}</div>
        {totalCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-content-subtle">
            <PieChart size={12} slices={[{ percentage: completionPercentage, color: "var(--color-green-500)" }]} />
            <span>
              {t("{{completed}}/{{total}} completed ({{percentage}}%)", {
                completed: completedCount,
                total: totalCount,
                percentage: completionPercentage,
              })}
            </span>
          </div>
        )}
      </div>

      {totalCount === 0 && <div className="text-content-dimmed text-xs">{t("No milestones")}</div>}

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
