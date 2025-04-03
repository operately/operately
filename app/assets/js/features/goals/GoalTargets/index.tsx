import * as React from "react";
import * as Goals from "@/models/goals";

import { ProgressBar } from "@/components/charts";

export function GoalTargets({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-bold uppercase mb-2">Targets</div>

      <div className="flex flex-col gap-4">
        {goal.targets!.map((target) => (
          <TargetItem key={target!.id} target={target!} />
        ))}
      </div>
    </div>
  );
}

function TargetItem({ target }: { target: Goals.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return (
    <div>
      <div className="flex items-end justify-between mb-1.5">
        <div className="font-semibold flex-1">{target.name}</div>
        <div className="text-sm">
          {target.value} / {target.to} {target.unit}
        </div>
      </div>

      <ProgressBar
        percentage={progress}
        width="w-full"
        height="h-1.5"
        rounded={false}
        bgColor="var(--color-stroke-base)"
      />
    </div>
  );
}
