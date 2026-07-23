import React from "react";

import type { GoalCheck, Target } from "../../../ApiTypes";
import { IconSquare, IconSquareCheckFilled } from "../../../icons";
import { PieChart } from "../../../PieChart";
import classNames from "../../../utils/classnames";
import {
  calculateTargetProgress,
  formatTargetValueSummary,
} from "../../../utils/goalTargetProgress";

interface GoalProgressSummaryProps {
  targets: Target[];
  checklist: GoalCheck[];
}

export function GoalProgressSummary({ targets, checklist }: GoalProgressSummaryProps) {
  const hasTargets = targets.length > 0;
  const hasChecklist = checklist.length > 0;

  if (!hasTargets && !hasChecklist) {
    return (
      <div className="text-content-dimmed text-xs font-normal" data-testid="goal-progress-summary-content">
        No targets or checklist
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 min-w-[220px] max-w-[320px] font-normal"
      data-testid="goal-progress-summary-content"
    >
      {hasTargets && <TargetsSection targets={targets} />}
      {hasChecklist && <ChecklistSection checklist={checklist} />}
    </div>
  );
}

function TargetsSection({ targets }: { targets: Target[] }) {
  const sorted = [...targets].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  return (
    <div>
      <div className="text-xs font-semibold text-content-dimmed uppercase tracking-wide mb-1.5">Targets</div>
      <div className="flex flex-col gap-1.5">
        {sorted.map((target) => (
          <TargetRow key={target.id ?? target.name ?? String(target.index)} target={target} />
        ))}
      </div>
    </div>
  );
}

function TargetRow({ target }: { target: Target }) {
  const progress = calculateTargetProgress(target);
  const valueSummary = formatTargetValueSummary(target);

  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="mt-0.5 flex-shrink-0">
        <PieChart size={14} slices={[{ percentage: progress, color: "var(--color-green-500)" }]} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-content-accent">{target.name}</div>
        {valueSummary && <div className="text-xs text-content-subtle mt-0.5">{valueSummary}</div>}
      </div>
    </div>
  );
}

function ChecklistSection({ checklist }: { checklist: GoalCheck[] }) {
  const sorted = [...checklist].sort((a, b) => a.index - b.index);
  const completedCount = sorted.filter((item) => item.completed).length;
  const totalCount = sorted.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="text-xs font-semibold text-content-dimmed uppercase tracking-wide">Checklist</div>
        <div className="flex items-center gap-1.5 text-xs text-content-subtle">
          <PieChart size={12} slices={[{ percentage: completionPercentage, color: "var(--color-green-500)" }]} />
          <span>
            {completedCount}/{totalCount} completed ({completionPercentage}%)
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {sorted.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ChecklistRow({ item }: { item: GoalCheck }) {
  const nameClass = classNames("text-sm truncate", {
    "line-through text-content-dimmed": item.completed,
    "text-content-accent": !item.completed,
  });

  return (
    <div className="flex items-center gap-2 min-w-0">
      {item.completed ? (
        <IconSquareCheckFilled size={14} className="text-accent-1 flex-shrink-0" />
      ) : (
        <IconSquare size={14} className="text-content-subtle flex-shrink-0" />
      )}
      <span className={nameClass}>{item.name}</span>
    </div>
  );
}
