import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";

export function SuccessConditions({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-bold uppercase">SUCCESS CONDITIONS</div>

      <div className="grid grid-cols-1 border-stroke-base border shadow-sm rounded">
        {goal.targets!.map((target) => (
          <TargetItem key={target!.id} target={target!} />
        ))}
      </div>
    </div>
  );
}

function TargetItem({ target }: { target: Goals.Target }) {
  return (
    <div className="flex justify-between items-start rounded not-first:border-t border-stroke-base">
      <div className="flex items-center gap-2 p-4 py-3">
        <div className="font-semibold flex-1">{target.name}</div>
      </div>

      <div className="w-64 p-4 py-2 border-l border-stroke-base">
        <CurrentValue target={target} />
        <ProgressBar target={target} />
        <Range target={target} />
      </div>
    </div>
  );
}

function CurrentValue({ target }: { target: Goals.Target }) {
  return (
    <div className="flex items-baseline gap-1">
      <div className="text-lg font-bold">{target.value}</div>
      <div className="text-xs text-content-accent">{target.unit}</div>
    </div>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  return (
    <div className="h-2 bg-surface-outline rounded relative overflow-hidden">
      <div
        className="bg-accent-1 rounded absolute top-0 bottom-0 left-0"
        style={{ width: `${Goals.targetProgressPercentage(target)}%` }}
      />
    </div>
  );
}

function Range({ target }: { target: Goals.Target }) {
  return (
    <div className="text-xs inline-flex gap-1 items-center text-content-dimmed">
      Target: {target.value} <Icons.IconArrowRight size={12} /> {target.to}
    </div>
  );
}
