import * as React from "react";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { TargetChange, TargetProgress } from "@/features/goals/GoalCheckIn/TargetsSection";

export function ConditionChanges({ update }: { update: GoalCheckIns.Update }) {
  const targets = (update.goalTargetUpdates ?? [])
    .map((t) => t!)
    .slice()
    .sort((a, b) => a.index! - b.index!);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col py-2">
        {targets.map((target) => (
          <div key={target.id} className="flex justify-between items-center gap-2 py-1.5">
            <div className="font-medium truncate">{target.name}</div>
            <div className="h-px bg-stroke-base flex-1" />
            <TargetChange target={target} />
            <TargetProgress value={target.value} start={target.from} end={target.to} />
          </div>
        ))}
      </div>
    </div>
  );
}
