import React from "react";

import { ExpandIcon } from "./ExpandIcon";
import { PieChart } from "../PieChart";

import { DangerButton, PrimaryButton, SecondaryButton } from "../Button";
import { IconTrash } from "@tabler/icons-react";
import { DragAndDropProvider, useDraggable, useDraggingAnimation, useDropZone } from "../utils/DragAndDrop";
import { IconGripVertical } from "@tabler/icons-react";

import TextareaAutosize from "react-textarea-autosize";
import classNames from "../utils/classnames";
import { State, TargetState, useGoalTargetListState } from "./useGoalTargetListState";

export namespace GoalTargetList {
  export type Target = {
    id: string;
    from: number;
    to: number;
    value: number;
    unit: string;
    name: string;
    index: number;
    mode: "view" | "edit" | "delete";
  };

  export interface Props {
    targets: Target[];
    showEditButton?: boolean;
  }
}

export function GoalTargetList(props: GoalTargetList.Props) {
  const state = useGoalTargetListState(props);

  return (
    <DragAndDropProvider onDrop={state.reorder}>
      <TargetList state={state} />
    </DragAndDropProvider>
  );
}

function TargetList({ state }: { state: State }) {
  const { ref } = useDropZone({ id: "targets", dependencies: [state.targets] });

  return (
    <div ref={ref}>
      {state.targets.map((target, index) => (
        <TargetCard key={target.id} state={state} target={target} />
      ))}
    </div>
  );
}

function TargetCard({ state, target }: { state: State; target: TargetState }) {
  if (target.mode === "view") {
    return <TargetView state={state} target={target} />;
  }

  if (target.mode === "edit") {
    return <TargetEdit state={state} target={target} />;
  }

  if (target.mode === "delete") {
    return <TargetDelete state={state} target={target} />;
  }

  throw new Error(`Unknown mode: ${target.mode}`);
}

function TargetEdit({ state, target }: { state: State; target: TargetState }) {
  const [name, setName] = React.useState(target.name);
  const [from, setFrom] = React.useState<string>(target.from.toString());
  const [to, setTo] = React.useState<string>(target.to.toString());
  const [value, setValue] = React.useState<string>(target.value.toString());
  const [unit, setUnit] = React.useState(target.unit);

  return (
    <InlineModal target={target}>
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
        <DeleteButton state={state} target={target} />
        <SecondaryButton size="xs" onClick={() => state.cancelEdit(target.id)}>
          Cancel
        </SecondaryButton>

        <PrimaryButton
          size="xs"
          onClick={() =>
            state.saveEdit(target.id, {
              name,
              from: parseFloat(from),
              to: parseFloat(to),
              value: parseFloat(value),
              unit,
            })
          }
        >
          Save
        </PrimaryButton>
      </div>
    </InlineModal>
  );
}

function DeleteButton({ state, target }: { state: State; target: TargetState }) {
  const clickHandler = (e: React.MouseEvent) => {
    e.stopPropagation();
    state.startDeleting(target.id);
  };

  return (
    <div
      className="rounded-full p-1.5 flex items-center justify-center mr-1 hover:bg-surface-dimmed cursor-pointer"
      onClick={clickHandler}
    >
      <IconTrash size={16} className="text-red-500 cursor-pointer" onClick={() => state.startDeleting(target.id)} />
    </div>
  );
}

function TargetDelete({ state, target }: { state: State; target: TargetState }) {
  return (
    <InlineModal target={target}>
      <div className="mb-2 font-bold">Delete {target.name} target?</div>
      <p>This will remove your target and all associated progress tracking.</p>

      <div className="flex items-center gap-2 justify-end mt-6">
        <SecondaryButton size="xs" onClick={() => state.cancelDelete(target.id)}>
          Cancel
        </SecondaryButton>

        <DangerButton size="xs" onClick={() => state.deleteTarget(target.id)}>
          Yes, Delete
        </DangerButton>
      </div>
    </InlineModal>
  );
}

function InlineModal({ target, children }: { target: TargetState; children: React.ReactNode }) {
  const outerClass = "border-b border-stroke-base";

  const innerClass = classNames("border border-surface-outline rounded-lg p-4 shadow-lg", {
    "mb-4": target.index === 0,
    "my-4": target.index !== 0,
  });

  return (
    <div className={outerClass}>
      <div className={innerClass}>{children}</div>
    </div>
  );
}

function TargetView({ state, target }: { state: State; target: TargetState }) {
  const { itemStyle } = useDraggingAnimation("targets", state.targets);

  const { ref, isDragging } = useDraggable({
    id: target.id!,
    zoneId: "targets",
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    state.startEditing(target.id!);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    state.toggleExpand(target.id!);
  };

  const undraggedStyle = itemStyle(target.id!);
  const draggedStyle = { background: "var(--color-surface-base)" };

  const outerClass = classNames("max-w-full py-2 px-px border-b border-stroke-base flex-1", {
    "border-t": target.index === 0 || isDragging,
  });

  const innerClass = classNames("grid gap-2 items-start cursor-pointer", {
    "grid-cols-[1fr_auto_auto_14px]": target.editButtonVisible,
    "grid-cols-[1fr_auto_14px]": !target.editButtonVisible,
  });

  const dragGripClass = classNames("opacity-0 group-hover:opacity-100 transition-all", {
    "cursor-grab": !isDragging,
    "cursor-grabbing": isDragging,
    "opacity-100": isDragging,
  });

  return (
    <div
      className="group flex items-center w-[calc(100% + 16px)] -ml-[16px]"
      ref={ref}
      style={isDragging ? draggedStyle : undraggedStyle}
    >
      <IconGripVertical size={16} className={dragGripClass} />

      <div className={outerClass}>
        <div onClick={toggleExpand} className={innerClass}>
          <TargetName target={target} truncate={!target.expanded} />
          <TargetValue target={target} />
          {target.editButtonVisible && <EditValueButton onClick={handleEdit} />}
          <ExpandIcon expanded={target.expanded} onClick={toggleExpand} />
        </div>

        {target.expanded && <TargetDetails target={target} />}
      </div>
    </div>
  );
}

function TargetName({ target, truncate }: { target: TargetState; truncate?: boolean }) {
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
