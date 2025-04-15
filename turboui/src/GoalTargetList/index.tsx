import React from "react";

import { ExpandIcon } from "./ExpandIcon";
import { PieChart } from "../PieChart";

import classNames from "../utils/classnames";

export namespace GoalTargetList {
  export type Target = {
    id: string;
    from: number;
    to: number;
    value: number;
    unit: string;
    name: string;
  };

  export interface Props {
    targets: Target[];
    field: string;
  }
}

export function GoalTargetList(props: GoalTargetList.Props) {
  return (
    <div>
      {props.targets.map((target) => (
        <TargetCard key={target.id} target={target} />
      ))}
    </div>
  );
}

function TargetCard({ target }: { target: GoalTargetList.Target }) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = () => setOpen(!open);

  return (
    <div className="max-w-full py-2 px-px border-t last:border-b border-stroke-base">
      <div
        onClick={handleToggle}
        className="grid grid-cols-[1fr_auto_14px] gap-2 items-start cursor-pointer"
      >
        <TargetNameSection target={target} truncate={!open} />
        <TargetValue target={target} />
        <ExpandIcon expanded={open} onClick={handleToggle} />
      </div>

      {open && <TargetDetails target={target} />}
    </div>
  );
}

function TargetNameSection({
  target,
  truncate,
}: {
  target: GoalTargetList.Target;
  truncate?: boolean;
}) {
  const progress = 100;
  const nameClass = classNames("flex gap-2 flex-1", { truncate: truncate });

  return (
    <div className={nameClass}>
      <div className="mt-1.5">
        <PieChart
          size={16}
          slices={[{ percentage: progress, color: "var(--color-green-500)" }]}
        />
      </div>

      <NameView name={target.name} truncate={truncate} />
    </div>
  );
}

function NameView({ name, truncate }: { name: string; truncate?: boolean }) {
  const className = classNames("font-medium mt-0.5", { truncate: truncate });

  return <div className={className}>{name}</div>;
}

function TargetValue({ target }: { target: GoalTargetList.Target }) {
  return (
    <div className="flex items-center">
      <div className="py-1 text-right text-sm">
        <span className="font-extrabold">{target.value}</span>
        {target.unit === "%" ? "%" : ` ${target.unit}`}
      </div>
    </div>
  );
}

function TargetDetails({ target }: { target: GoalTargetList.Target }) {
  const { from, to, unit, value } = target;
  const progress = ((value - from!) / (to! - from!)) * 100; // Calculate progress as a percentage of the range from "from" to "to"

  const directionText = from! > to! ? "down to" : "to";

  const formatUnit = (value) => {
    return `${value}${unit === "%" ? "%" : ` ${unit}`}`;
  };

  return (
    <div className="text-sm ml-6 rounded-lg my-2">
      <div className="flex items-center gap-2">
        <div className="w-20 font-semibold">Target</div>
        <div>
          From <span className="font-semibold">{from}</span> {directionText}{" "}
          <span className="font-semibold">{to}</span>
          {unit === "%" ? "%" : ` ${unit}`}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-20 font-semibold">Current</div>
        <div>
          {formatUnit(value)}{" "}
          <span className={progress < 0 ? "text-red-500" : ""}>
            ({progress.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
