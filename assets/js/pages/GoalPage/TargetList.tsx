import * as React from "react";
import * as Goals from "@/models/goals";

export function TargetList({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex flex-col gap-4">
      {goal.targets!.map((target) => (
        <TargetItem key={target!.id} target={target!} />
      ))}
    </div>
  );
}

function TargetItem({ target }: { target: Goals.Target }) {
  return (
    <div className="flex items-center justify-between border border-stroke-base py-3 px-5 rounded-lg">
      <div className="flex flex-col">
        <div className="font-semibold text-content-accent">{target.name}</div>
        <div className="text-content-dimmed text-sm">
          Current: {target.value} {target.unit} &middot; Target {target.to} {target.unit}
        </div>
      </div>

      <div className="flex flex-col gap1">
        <ProgressBar target={target} />
      </div>
    </div>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  const from = target!.from!;
  const to = target!.to!;
  const value = target!.value!;

  let progress = Math.round(((value - from) / (to - from)) * 100);
  if (progress < 0) progress = 0;
  if (progress > 100) progress = 100;

  let color = "";
  if (progress < 20) color = "bg-yellow-300";
  if (progress >= 40 && progress < 80) color = "bg-yellow-500";
  if (progress >= 70) color = "bg-green-600";

  return (
    <div className="text-ellipsis w-40 bg-gray-200 relative h-3 overflow-hidden rounded-sm">
      <div className={"absolute top-0 left-0 h-full" + " " + color} style={{ width: `${progress}%` }} />
    </div>
  );
}
