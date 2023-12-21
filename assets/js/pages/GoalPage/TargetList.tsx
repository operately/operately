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
    <div className="flex items-start gap-3 border border-stroke-base py-3 px-5 rounded-lg">
      <div className="flex flex-col">
        <div className="font-semibold text-content-accent">{target.name}</div>
        <div className="text-content-dimmed">
          {target.from} → {target.to} {target.unit}
        </div>
      </div>
    </div>
  );
}
