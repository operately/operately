import React from "react";

import * as Goals from "@/models/goals";
import { IconTrash } from "turboui";

import classNames from "classnames";
import { PrimaryButton, SecondaryButton } from "turboui";
import { PieChart } from "turboui";
import { Target } from "./types";
import { ExpandIcon, TargetNumericField, TargetTextField, TargetValue } from "./components";
import { useTargetsContext } from "./TargetsContext";

interface Props {
  index: number;
  target: Target;
}

export function EditTargetCard({ target, index }: Props) {
  const { targetOpen } = useTargetsContext();
  const editing = targetOpen === target.id;

  const containerClass = classNames(
    "max-w-full py-2 px-px cursor-pointer",
    "grid grid-cols-[1fr_auto_14px] items-center gap-x-3",
    "border-t last:border-b border-stroke-base",
  );

  return (
    <div className={containerClass}>
      <TitleSection target={target} index={index} editing={editing} />
      <DetailsSection target={target} editing={editing} />
      <Actions target={target} editing={editing} />
    </div>
  );
}

function TitleSection({ target, index, editing }) {
  const className = classNames("flex items-center gap-2 truncate", { "col-span-2": target.isNew });

  return (
    <>
      <div className={className}>
        <ProgressPieChart target={target} />
        <NameField target={target} editing={editing} />
      </div>
      {!target.isNew && (
        <div className="max-w-[160px] truncate">
          <TargetValue readonly index={index} target={target} />
        </div>
      )}
      <ExpandIcon expanded={editing} className="cursor-pointer" />
    </>
  );
}

function DetailsSection({ target, editing }) {
  if (!editing) return null;

  return (
    <div className="col-span-3 mt-2 grid grid-cols-3 gap-2">
      <TargetNumericField label="Start" target={target} field="from" testid="target-input-from" placeholder="30" />
      <TargetNumericField label="Target" target={target} field="to" testid="target-input-to" placeholder="15" />
      <TargetTextField label="Unit" target={target} field="unit" testid="target-input-unit" placeholder="minutes" />
    </div>
  );
}

function NameField({ editing, target }: { target: Target; editing: boolean }) {
  if (!editing) {
    return <div className="font-medium truncate">{target.name}</div>;
  } else {
    return (
      <div className="w-full relative">
        <TargetTextField
          target={target}
          field="name"
          testid="target-input-name"
          placeholder="e.g. Average Onboarding Time is twice as fast"
        />
      </div>
    );
  }
}

function ProgressPieChart({ target }: { target: Target }) {
  const progress = Goals.targetProgressPercentage(target);

  if (target.isNew) return null;
  return <PieChart size={16} slices={[{ percentage: progress, color: "var(--color-accent-1)" }]} />;
}

function Actions({ editing, target }: { editing: boolean; target: Target }) {
  const { closeEdit, resetEdit, targetOpen, deleteTarget } = useTargetsContext();

  if (!editing) return <></>;

  return (
    <div className="mt-3 flex items-center gap-2">
      <PrimaryButton size="sm" onClick={() => closeEdit(targetOpen)}>
        Done
      </PrimaryButton>
      {!target.isNew && (
        <SecondaryButton size="sm" onClick={() => resetEdit(targetOpen)}>
          Cancel
        </SecondaryButton>
      )}
      <IconTrash className="text-content-dimmed cursor-pointer" size={20} onClick={() => deleteTarget(targetOpen)} />
    </div>
  );
}
