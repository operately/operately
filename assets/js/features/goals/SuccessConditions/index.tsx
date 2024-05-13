import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";

export function SuccessConditions({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-bold uppercase mb-3">SUCCESS CONDITIONS</div>

      <div className="flex flex-col gap-2.5">
        {goal.targets!.map((target) => (
          <TargetItem key={target!.id} target={target!} />
        ))}
      </div>
    </div>
  );
}

function TargetItem({ target }: { target: Goals.Target }) {
  return (
    <div className="flex justify-between border items-center gap-8 py-2 px-4 rounded-2xl">
      <div className="flex items-center gap-2 flex-1">
        <Icons.IconTimeline size={20} />
        <div className="font-semibold flex-1">{target.name}</div>
      </div>

      <div className="shrink-0 w-40">
        <ProgressBar target={target} />
      </div>

      <div className="shrink-0 w-32 flex flex-col">
        <CurrentValue target={target} />
        <Range target={target} />
      </div>
    </div>
  );
}

function CurrentValue({ target }: { target: Goals.Target }) {
  return (
    <div className="flex items-baseline gap-1">
      <div className="font-bold">{target.value}</div>
      <div className="text-sm text-content-accent">{target.unit}</div>
    </div>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return (
    <div className="h-3 bg-stone-500/20 rounded relative overflow-hidden">
      <div
        className="bg-green-600 absolute top-0 bottom-0 left-0"
        style={{ width: progress === 0 ? "3px" : progress + "%" }}
      />
    </div>
  );
}

function Range({ target }: { target: Goals.Target }) {
  return (
    <div className="text-xs inline-flex gap-1 items-center text-content-dimmed">
      Target: {target.from} <Icons.IconArrowRight size={12} /> {target.to}
    </div>
  );
}
