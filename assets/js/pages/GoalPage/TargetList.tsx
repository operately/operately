import * as React from "react";
import * as Goals from "@/models/goals";

export function TargetList({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      {goal.targets!.map((target) => (
        <TargetItem key={target!.id} target={target!} />
      ))}
    </div>
  );
}

function TargetItem({ target }: { target: Goals.Target }) {
  return (
    <div className="flex items-start gap-3">
      <TargetIndex index={0} />
      <div className="flex flex-col -mt-1">
        <div className="font-medium text-lg">{target.name}</div>
        <div className="text-content-dimmed">
          {target.from} → {target.to} {target.unit}
        </div>
      </div>
    </div>
  );
}

function TargetIndex({ index }: { index: number }) {
  return (
    <div className="rounded-full bg-accent-1 w-5 h-5 flex items-center justify-center ml-0.5">
      <div className="text-xs font-bold text-white-1">{index + 1}</div>
    </div>
  );
}
