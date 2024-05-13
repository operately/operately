import * as React from "react";
import * as GoalCheckIns from "@/models/goalCheckIns";

export function ConditionChanges({ update }: { update: GoalCheckIns.GoalCheckIn }) {
  const content = update.content as GoalCheckIns.GoalCheckInContent;
  const targets = (content.targets || [])
    .map((t) => t!)
    .slice()
    .sort((a, b) => a.index - b.index);

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

function TargetProgress({ value, start, end }) {
  const total = end - start;
  const progress = (value - start) / total;
  const width = 100 * progress;

  return (
    <div className="text-xs font-medium bg-gray-500 rounded px-1.5 py-0.5 text-white-1 relative w-[60px] text-right truncate">
      <div className="absolute top-0 left-0 bottom-0 bg-accent-1 rounded" style={{ width: `${width}%` }} />

      <div className="relative">
        {value} / {end}
      </div>
    </div>
  );
}

function TargetChange({ target }) {
  const newProgress = target.value - target.from;
  const oldProgress = target.previousValue - target.from;
  const diff = newProgress - oldProgress;

  if (newProgress > oldProgress) {
    return <div className="text-green-600 font-bold shrink-0 text-sm">+ {Math.abs(diff)}</div>;
  } else if (newProgress < oldProgress) {
    return <div className="text-red-500 font-bold shrink-0 test-sm">- {Math.abs(diff)}</div>;
  } else {
    return <div className="flex items-center gap-1 text-content-dimmed font-medium shrink-0 text-xs">No Change</div>;
  }
}
