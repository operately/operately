import React from "react";

import { ExpandIcon } from "./ExpandIcon";
import { PieChart } from "../PieChart";

import classNames from "../utils/classnames";
import { SecondaryButton } from "../Button";
import { th } from "date-fns/locale";
import { on } from "events";

export namespace GoalTargetList {
  export type Target = {
    id: string;
    from: number;
    to: number;
    value: number;
    unit: string;
    name: string;
    showEditValueButton?: boolean;
    mode: "view" | "edit";
    setMode: (mode: "view" | "edit") => void;
  };

  export interface Props {
    targets: Target[];
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
  const [mode, setMode] = React.useState<"view" | "edit">(target.mode);

  if (mode === "edit") {
    return <TargetEdit target={target} onSaveClick={() => setMode("view")} />;
  }

  if (mode === "view") {
    return <TargetView target={target} onEditClick={() => setMode("edit")} />;
  }

  throw new Error(`Unknown mode: ${mode}`);
}

function TargetEdit({ target, onSaveClick }: { target: GoalTargetList.Target; onSaveClick: () => void }) {
  return (
    <SecondaryButton size="xxs" onClick={onSaveClick}>
      Save
    </SecondaryButton>
  );
}

function TargetView({ target, onEditClick }: { target: GoalTargetList.Target; onEditClick: () => void }) {
  const [open, toggle] = useToggle();

  const outerClass = "max-w-full py-2 px-px border-t last:border-b border-stroke-base";
  const innerClass = classNames("grid gap-2 items-start cursor-pointer", {
    "grid-cols-[1fr_auto_auto_14px]": target.showEditValueButton,
    "grid-cols-[1fr_auto_14px]": !target.showEditValueButton,
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick();
  };

  return (
    <div className={outerClass}>
      <div onClick={toggle} className={innerClass}>
        <TargetNameSection target={target} truncate={!open} />
        <TargetValue target={target} />
        {target.showEditValueButton && <EditValueButton onClick={handleEdit} />}
        <ExpandIcon expanded={open} onClick={toggle} />
      </div>
      {open && <TargetDetails target={target} />}
    </div>
  );
}

function useToggle(): [boolean, () => void] {
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen(!open);

  return [open, toggle];
}

function TargetNameSection({ target, truncate }: { target: GoalTargetList.Target; truncate?: boolean }) {
  const progress = calculateProgress(target);
  const nameClass = classNames("flex gap-2 flex-1", { truncate: truncate });

  return (
    <div className={nameClass}>
      <div className="mt-1.5">
        <PieChart size={16} slices={[{ percentage: progress, color: "var(--color-green-500)" }]} />
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
  const progress = calculateProgress(target, false);

  const directionText = from! > to! ? "down to" : "to";

  const formatUnit = (value) => {
    return `${value}${unit === "%" ? "%" : ` ${unit}`}`;
  };

  return (
    <div className="text-sm ml-6 rounded-lg my-2">
      <div className="flex items-center gap-2">
        <div className="w-20 font-semibold">Target</div>
        <div>
          From <span className="font-semibold">{from}</span> {directionText} <span className="font-semibold">{to}</span>
          {unit === "%" ? "%" : ` ${unit}`}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-20 font-semibold">Current</div>
        <div>
          {formatUnit(value)} <span className={progress < 0 ? "text-red-500" : ""}>({progress.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}

function calculateProgress(target: GoalTargetList.Target, clamped = true): number {
  const from = target.from!;
  const to = target.to!;
  const value = target.value!;

  let percentage: number;
  if (from < to) {
    percentage = ((value - from) / (to - from)) * 100;
  } else {
    percentage = ((from - value) / (from - to)) * 100;
  }

  if (clamped) {
    return Math.max(0, Math.min(100, percentage));
  }

  return percentage;
}

function EditValueButton({ onClick }: { onClick?: (e: React.MouseEvent) => void }) {
  return (
    <div className="mt-px">
      <SecondaryButton size="xxs" onClick={onClick}>
        Edit
      </SecondaryButton>
    </div>
  );
}
