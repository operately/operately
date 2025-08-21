import React from "react";

import { PieChart } from "../PieChart";
import { ExpandIcon } from "./ExpandIcon";

import { DangerButton, PrimaryButton, SecondaryButton } from "../Button";
import { IconGripVertical } from "../icons";
import { DragAndDropProvider, useDraggable, useDraggingAnimation, useDropZone } from "../utils/DragAndDrop";

import { useForm } from "react-hook-form";
import classNames from "../utils/classnames";
import { State, TargetState, useGoalTargetListState } from "./useGoalTargetListState";

import { DeleteButton } from "./DeleteButton";
import { EditButton } from "./EditButton";
import { UpdateButton } from "./UpdateButton";

import { Textarea } from "../forms/Textarea";
import { Textfield } from "../forms/Textfield";
import { SwitchToggle } from "../SwitchToggle";
import { createTestId } from "../TestableElement";

export namespace GoalTargetList {
  export type Target = {
    id: string;
    from: number;
    to: number;
    value: number;
    unit: string;
    name: string;
    index: number;
    mode: "view" | "update" | "edit" | "delete";
  };

  export type AddTargetFn = (inputs: {
    name: string;
    startValue: number;
    targetValue: number;
    unit: string;
  }) => Promise<{
    success: boolean;
    id: string;
  }>;

  export type DeleteTargetFn = (id: string) => Promise<boolean>;

  export type UpdateTargetFn = (inputs: {
    targetId: string;
    name: string;
    startValue: number;
    targetValue: number;
    unit: string;
  }) => Promise<boolean>;

  export type UpdateTargetValueFn = (id: string, value: number) => Promise<boolean>;
  export type UpdateTargetIndexFn = (id: string, index: number) => Promise<boolean>;

  export interface Props {
    targets: Target[];

    showEditButton?: boolean;
    showUpdateButton?: boolean;

    addActive?: boolean;
    onAddActiveChange?: (active: boolean) => void;

    addTarget: AddTargetFn;
    deleteTarget: DeleteTargetFn;
    updateTarget: UpdateTargetFn;
    updateTargetValue: UpdateTargetValueFn;
    updateTargetIndex: UpdateTargetIndexFn;
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
      {state.targets.length > 0 && <TargetListHeader />}

      {state.targets.map((target) => (
        <TargetCard key={target.id} state={state} target={target} />
      ))}

      {state.addActive && <TargetAdd state={state} />}
    </div>
  );
}

function TargetListHeader() {
  const className = classNames(
    "flex items-center px-2 py-2",
    "border-t border-stroke-base font-semibold text-xs text-content-dimmed uppercase tracking-wider",
  );

  return (
    <div className={className}>
      <div className="flex-1">Name</div>
      <div className="w-40 text-right">Current value</div>
    </div>
  );
}

function TargetCard({ state, target }: { state: State; target: TargetState }) {
  if (target.mode === "view") {
    return <TargetView state={state} target={target} />;
  }

  if (target.mode === "update") {
    return <TargetUpdate state={state} target={target} />;
  }

  if (target.mode === "edit") {
    return <TargetEdit state={state} target={target} />;
  }

  if (target.mode === "delete") {
    return <TargetDelete state={state} target={target} />;
  }

  throw new Error(`Unknown mode: ${target.mode}`);
}

function TargetAdd({ state }: { state: State }) {
  const [createMore, setCreateMore] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      from: "",
      to: "",
      unit: "",
    },
  });

  const onSubmit = (data: any) => {
    state.addTarget({
      name: data.name,
      from: parseFloat(data.from),
      to: parseFloat(data.to),
      unit: data.unit,
    });

    if (createMore) {
      reset();
    } else {
      state.cancelAdd();
    }
  };

  return (
    <InlineModal index={100}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Textarea
          testId="target-name"
          label="Name"
          autoFocus
          placeholder="e.g. Increase monthly signup count"
          error={errors.name?.message as string}
          {...register("name", { required: "Can't be empty" })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <Textfield
            testId={"target-from"}
            label="Start"
            error={errors.from?.message as string}
            {...register("from", {
              required: "Can't be empty",
              validate: (v) => !isNaN(Number(v)) || "Must be a number",
            })}
            placeholder="e.g. 10000"
          />
          <Textfield
            testId={"target-to"}
            label="Target"
            error={errors.to?.message as string}
            {...register("to", {
              required: "Can't be empty",
              validate: (v) => !isNaN(Number(v)) || "Must be a number",
            })}
            placeholder="e.g. 15000"
          />
          <Textfield
            testId={"target-unit"}
            label="Unit"
            error={errors.unit?.message as string}
            {...register("unit", { required: "Can't be empty" })}
            placeholder="e.g. users"
          />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <SwitchToggle value={createMore} setValue={setCreateMore} label="Create more" />
          <div className="flex-1"></div>
          <SecondaryButton size="xs" onClick={() => state.cancelAdd()} type="button" testId="cancel">
            Cancel
          </SecondaryButton>
          <PrimaryButton size="xs" type="submit" testId="save">
            Add Target
          </PrimaryButton>
        </div>
      </form>
    </InlineModal>
  );
}

function TargetUpdate({ state, target }: { state: State; target: TargetState }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      value: target.value.toString(),
    },
  });

  const onSubmit = (data: any) => {
    state.updateTarget(target.id!, parseFloat(data.value));
  };

  return (
    <InlineModal index={target.index}>
      <p className="mb-4 font-medium">Update {target.name}</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Textfield
          testId="target-value"
          autoFocus
          label="New Value"
          error={errors.value?.message as string}
          addonRight={target.unit}
          textRight
          {...register("value", {
            required: "Can't be empty",
            validate: (v) => !isNaN(Number(v)) || "Must be a number",
          })}
        />
        <div className="flex items-center gap-2 justify-end mt-4">
          <SecondaryButton size="xs" onClick={() => state.cancelEdit(target.id)} type="button" testId="cancel">
            Cancel
          </SecondaryButton>
          <PrimaryButton size="xs" type="submit" testId="save">
            Save
          </PrimaryButton>
        </div>
      </form>
    </InlineModal>
  );
}

function TargetEdit({ state, target }: { state: State; target: TargetState }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: target.name,
      from: target.from.toString(),
      to: target.to.toString(),
      unit: target.unit,
    },
  });

  const onSubmit = (data: any) => {
    state.saveEdit(target.id, {
      name: data.name,
      from: parseFloat(data.from),
      to: parseFloat(data.to),
      unit: data.unit,
    });
  };

  return (
    <InlineModal index={target.index}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Textarea
          label="Name"
          autoFocus
          error={errors.name?.message as string}
          {...register("name", { required: "Can't be empty" })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <Textfield
            label="Start"
            error={errors.from?.message as string}
            {...register("from", {
              required: "Can't be empty",
              validate: (v) => !isNaN(Number(v)) || "Must be a number",
            })}
          />
          <Textfield
            label="Target"
            error={errors.to?.message as string}
            {...register("to", {
              required: "Can't be empty",
              validate: (v) => !isNaN(Number(v)) || "Must be a number",
            })}
          />
          <Textfield
            label="Unit"
            error={errors.unit?.message as string}
            {...register("unit", { required: "Can't be empty" })}
          />
        </div>
        <div className="flex items-center gap-2 justify-end mt-4">
          <SecondaryButton size="xs" onClick={() => state.cancelEdit(target.id)} type="button">
            Cancel
          </SecondaryButton>
          <PrimaryButton size="xs" type="submit">
            Save
          </PrimaryButton>
        </div>
      </form>
    </InlineModal>
  );
}

function TargetDelete({ state, target }: { state: State; target: TargetState }) {
  return (
    <InlineModal index={target.index}>
      <div className="mb-2 font-bold">Delete {target.name} target?</div>
      <p>This will remove your target and all associated progress tracking.</p>

      <div className="flex items-center gap-2 justify-end mt-6">
        <SecondaryButton size="xs" onClick={() => state.cancelDelete(target.id)}>
          Cancel
        </SecondaryButton>

        <DangerButton size="xs" onClick={() => state.deleteTarget(target.id)} testId="confirm">
          Yes, Delete
        </DangerButton>
      </div>
    </InlineModal>
  );
}

function InlineModal({ index, children }: { index: number; children: React.ReactNode }) {
  const outerClass = "border-b border-stroke-base";

  const innerClass = classNames("border border-surface-outline rounded-lg p-8 px-6 shadow-lg", {
    "mb-4": index === 0,
    "my-4": index !== 0,
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
    "grid-cols-[1fr_auto_auto_14px]": target.updateButtonVisible,
    "grid-cols-[1fr_auto_14px]": !target.updateButtonVisible,
  });

  const dragGripClass = classNames(
    "mr-1 mt-[14px] text-content-subtle opacity-0 group-hover:opacity-100 transition-all",
    {
      "cursor-grab": !isDragging,
      "cursor-grabbing": isDragging,
      "opacity-100": isDragging,
    },
  );

  return (
    <div
      className="group flex items-start w-[calc(100% + 16px)] -ml-[16px]"
      ref={ref}
      style={isDragging ? draggedStyle : undraggedStyle}
      data-test-id={createTestId("target", target.name)}
    >
      <IconGripVertical size={16} className={dragGripClass} />

      <div className={outerClass}>
        <div onClick={toggleExpand} className={innerClass}>
          <TargetName target={target} truncate={!target.expanded} />
          <TargetValue target={target} />
          {target.updateButtonVisible && <UpdateButton state={state} target={target} />}
          <ExpandIcon expanded={target.expanded} onClick={toggleExpand} />
        </div>

        {target.expanded && <TargetDetails state={state} target={target} />}
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

function TargetDetails({ state, target }: { state: State; target: TargetState }) {
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

      <div className="flex items-center gap-2 mt-4">
        <EditButton state={state} target={target} />
        <DeleteButton state={state} target={target} />
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
  if (from === to) {
    percentage = 0; // If from and to are equal, progress is 0%
  } else if (from < to) {
    percentage = ((value - from) / (to - from)) * 100;
  } else if (from > to) {
    percentage = ((from - value) / (from - to)) * 100;
  } else {
    percentage = 0; // Fallback case
  }

  if (clamped) {
    return Math.max(0, Math.min(100, percentage));
  }

  return percentage;
}
