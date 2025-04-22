import React from "react";

import { ExpandIcon } from "./ExpandIcon";
import { PieChart } from "../PieChart";

import classNames from "../utils/classnames";
import { PrimaryButton, SecondaryButton } from "../Button";
import TextareaAutosize from "react-textarea-autosize";
import { IconTrash } from "@tabler/icons-react";

export namespace GoalTargetList {
  export type Target = {
    id: string;
    from: number;
    to: number;
    value: number;
    unit: string;
    name: string;
    mode: "view" | "edit";
  };

  export interface Props {
    targets: Target[];
    showEditButton?: boolean;
  }
}

export function GoalTargetList(props: GoalTargetList.Props) {
  return (
    <div>
      {props.targets.map((target, index) => (
        <TargetCard key={target.id} target={target} showEditButton={props.showEditButton} index={index} />
      ))}
    </div>
  );
}

interface TargetCardProps {
  target: GoalTargetList.Target;
  index: number;
  showEditButton?: boolean;
}

function TargetCard({ target, index, showEditButton }: TargetCardProps) {
  const [mode, setMode] = React.useState<"view" | "edit">(target.mode);

  if (mode === "edit") {
    return (
      <TargetEdit
        target={target}
        onSaveClick={() => setMode("view")}
        onCancelClick={() => setMode("view")}
        index={index}
      />
    );
  }

  if (mode === "view") {
    return <TargetView target={target} onEditClick={() => setMode("edit")} showEditButton={showEditButton} />;
  }

  throw new Error(`Unknown mode: ${mode}`);
}

interface TargetEditProps {
  target: GoalTargetList.Target;
  index: number;
  onSaveClick: () => void;
  onCancelClick: () => void;
}

function TargetEdit({ target, index, onSaveClick, onCancelClick }: TargetEditProps) {
  const [name, setName] = React.useState(target.name);
  const [from, setFrom] = React.useState(target.from);
  const [to, setTo] = React.useState(target.to);
  const [value, setValue] = React.useState(target.value);
  const [unit, setUnit] = React.useState(target.unit);

  const outerClass = classNames({
    "border-t border-stroke-base": index !== 0,
  });

  const innerClass = classNames("border border-surface-outline rounded-lg p-4 shadow-lg", {
    "mb-4": index === 0,
    "my-4": index !== 0,
  });

  return (
    <div className={outerClass}>
      <div className={innerClass}>
        <div className="">
          <div className="font-bold text-sm mb-1">Current Value</div>

          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border border-stroke-base rounded-lg py-1.5 px-3"
            autoFocus
          />
        </div>

        <div className="mt-1">
          <div className="font-bold text-sm mb-0.5">Name</div>
          <Textarea
            autoexpand={true}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stroke-base rounded-lg py-1.5 px-3"
          />
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="flex-0.5">
            <div className="font-bold text-sm mb-0.5">Start</div>

            <Textarea
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-stroke-base rounded-lg py-1.5 px-3"
            />
          </div>

          <div className="flex-1">
            <div className="font-bold text-sm mb-0.5">Target</div>

            <Textarea
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-stroke-base rounded-lg py-1.5 px-3"
            />
          </div>

          <div className="flex-1">
            <div className="font-bold text-sm mb-0.5">Unit</div>

            <Textarea
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full border border-stroke-base rounded-lg py-1.5 px-3"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end mt-4">
          <IconTrash size={16} className="text-red-500 cursor-pointer mr-2" />

          <SecondaryButton size="xs" onClick={onCancelClick}>
            Cancel
          </SecondaryButton>

          <PrimaryButton size="xs" onClick={onSaveClick}>
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

interface TargetViewProps {
  target: GoalTargetList.Target;
  onEditClick: () => void;
  showEditButton?: boolean;
}

function TargetView({ target, onEditClick, showEditButton }: TargetViewProps) {
  const [open, toggle] = useToggle();

  const outerClass = "max-w-full py-2 px-px border-t last:border-b border-stroke-base";
  const innerClass = classNames("grid gap-2 items-start cursor-pointer", {
    "grid-cols-[1fr_auto_auto_14px]": showEditButton,
    "grid-cols-[1fr_auto_14px]": !showEditButton,
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick();
  };

  return (
    <div className={outerClass}>
      <div onClick={toggle} className={innerClass}>
        <TargetName target={target} truncate={!open} />
        <TargetValue target={target} />
        {showEditButton && <EditValueButton onClick={handleEdit} />}
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

function TargetName({ target, truncate }: { target: GoalTargetList.Target; truncate?: boolean }) {
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
          {formatValueAndUnit(value, unit)}{" "}
          <span className={progress < 0 ? "text-red-500" : ""}>({progress.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}

function formatValueAndUnit(value: number, unit: string): string {
  return `${value}${unit === "%" ? "%" : ` ${unit}`}`;
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

interface TextareaProps {
  autoexpand?: boolean;
  autoFocus?: boolean;
  className?: string;

  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function Textarea(props: TextareaProps) {
  const className = classNames("focus:border-indigo-500 bg-transparent", props.className);

  return (
    <TextareaAutosize
      value={props.value}
      onChange={props.onChange}
      className={className}
      style={{ resize: "none" }}
      autoFocus={props.autoFocus}
    />
  );
}
