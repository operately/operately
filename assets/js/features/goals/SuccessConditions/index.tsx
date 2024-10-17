import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";
import { ProgressPieChart } from "@/components/Charts";
import { Tooltip } from "@/components/Tooltip";

export function SuccessConditions({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex flex-col">
        {goal.targets!.map((target, index) => (
          <TargetItem target={target!} />
        ))}
      </div>
    </div>
  );
}

function TargetItem({ target }: { target: Goals.Target }) {
  const range = target.to - target.from;
  const progress = target.value - target.from;

  const tooltipContent = (
    <div>
      <div>
        <span className="text-content-accent font-bold">Starting value: </span>
        {target.from} {target.unit}
      </div>

      <div>
        <span className="text-content-accent font-bold">Target: </span>
        {target.to} {target.unit}
      </div>
    </div>
  );

  return (
    <div className="flex justify-between items-center py-4 pr-4 hover:bg-surface-highlight transition-colors duration-200 border-b first:border-t">
      <div className="flex items-center gap-3">
        <ProgressPieChart percent={Goals.targetProgressPercentage(target)} size={24} color={"green"} />
        <div className="text-sm sm:text-[16px] font-semibold">{target.name}</div>
      </div>

      <div className="text-xs sm:text-sm text-content-dimmed">
        <div className="flex items-center gap-1">
          {progress} out of {range} {target.unit}
          <span>
            <Tooltip content={tooltipContent} delayDuration={100}>
              <Icons.IconInfoCircle size={16} />
            </Tooltip>
          </span>
        </div>
      </div>
    </div>
  );
}
