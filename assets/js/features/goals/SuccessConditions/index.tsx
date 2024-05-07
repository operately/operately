import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";

export function SuccessConditions({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="relative bg-surface-dimmed -mx-12 px-12 py-8 -mb-10">
      {goal.targets!.map((target) => (
        <TargetItem key={target!.id} target={target!} />
      ))}

      <div className="w-0.5 bg-stroke-base absolute -top-11 left-16 bottom-12" />
    </div>
  );
}

function TargetItem({ target }: { target: Goals.Target }) {
  return (
    <div className="flex items-center justify-center gap-3 my-2.5 relative z-10 bg-surface -mx-1 rounded-2xl">
      <div className="flex-1 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-2 border rounded-2xl border-stroke-base p-2 py-3 flex-1">
          <div className="rounded-lg p-1.5 -ml-0.5">
            <Icons.IconTimeline size={20} />
          </div>

          <div className="font-medium flex-1">{target.name}</div>

          <div className="flex items-center gap-8 w-80">
            <div className="">
              <ProgressBar target={target} />
            </div>

            <div className="w-1/2 flex flex-col gap-1.5">
              <CurrentValue target={target} />
              <Range target={target} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentValue({ target }: { target: Goals.Target }) {
  return (
    <div className="font-semibold text-sm leading-none">
      {target.value} {target.unit}
    </div>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  return (
    <div className="rounded h-3 bg-stroke-base relative w-40 overflow-hidden">
      <div
        className="bg-emerald-500 absolute top-0 bottom-0 left-0"
        style={{ width: `${Goals.targetProgressPercentage(target)}%` }}
      />
    </div>
  );
}

function Range({ target }: { target: Goals.Target }) {
  return (
    <div className="text-xs inline-flex gap-1 items-center text-content-dimmed leading-none">
      Target: {target.value} &rarr; {target.to}
    </div>
  );
}
