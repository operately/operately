import * as React from "react";
import * as Goals from "@/models/goals";

export function TargetList({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex flex-col border-y border-stroke-base">
      {goal.targets!.map((target) => (
        <TargetItem key={target!.id} target={target!} />
      ))}
    </div>
  );
}

function TargetItem({ target }: { target: Goals.Target }) {
  return (
    <div className="flex items-center justify-between py-2 px-1 not-first:border-t border-stroke-base">
      <div className="flex flex-col">
        <div className="font-semibold text-content-accent">{target.name}</div>
        <div className="text-content-dimmed text-xs">
          Current {target.value} - Target {target.to} {target.unit}
        </div>
      </div>

      <div className="flex flex-col gap1">
        <ProgressBar target={target} />
      </div>
    </div>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  const from = target.from!;
  const to = target.to!;
  const value = target.value!;

  const width = ((Math.min(value, to) - from) / (Math.max(to, value) - from)) * 100;

  return (
    <div className={"w-24 h-2.5 bg-surface-outline rounded relative"}>
      <div className="bg-accent-1 rounded absolute top-0 bottom-0 left-0" style={{ width: `${width}%` }} />
    </div>
  );
}
