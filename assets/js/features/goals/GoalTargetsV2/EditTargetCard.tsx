import React from "react";

import * as Goals from "@/models/goals";
import { IconPencil, IconTrash } from "@tabler/icons-react";

import classNames from "classnames";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { MiniPieChart } from "@/components/charts";

import { Target } from "./types";
import { TargetNumericField, TargetTextField, TargetValue } from "./components";
import { useTargetsContext } from "./TargetsContext";

interface Props {
  index: number;
  target: Target;
}

export function EditTargetCard({ target, index }: Props) {
  const { targetOpen } = useTargetsContext();

  const editing = targetOpen === target.id;
  const containerClass = classNames(
    "group relative py-2 mb-2",
    editing ? "px-3" : "pl-3 pr-5",
    "grid grid-cols-[1fr_auto] items-center gap-x-3",
    "last:mb-0 border border-surface-outline rounded",
    "bg-surface-base",
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
  const { startEdit } = useTargetsContext();
  const className = classNames("flex items-center gap-2 truncate", { "col-span-2": target.isNew });

  return (
    <>
      <div className={className}>
        <PieChart target={target} />
        <NameField target={target} editing={editing} />
      </div>
      {!target.isNew && <TargetValue readonly index={index} target={target} />}

      {!editing && (
        <IconPencil
          onClick={() => startEdit(target.id!)}
          className="absolute right-0.5 top-0.5 rounded-full hover:bg-surface-accent cursor-pointer hover:text-accent-1 transition-colors"
          size={16}
        />
      )}
    </>
  );
}

function DetailsSection({ target, editing }) {
  if (!editing) return null;

  return (
    <div className="col-span-2 mt-2 grid grid-cols-3 gap-2">
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

function PieChart({ target }: { target: Target }) {
  const progress = Goals.targetProgressPercentage(target);

  if (target.isNew) return null;
  return <MiniPieChart completed={progress} total={100} size={16} />;
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
          Reset
        </SecondaryButton>
      )}
      <IconTrash className="text-content-dimmed cursor-pointer" size={20} onClick={() => deleteTarget(targetOpen)} />
    </div>
  );
}
