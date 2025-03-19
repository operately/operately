import React from "react";

import * as Goals from "@/models/goals";
import { IconPencil } from "@tabler/icons-react";

import Forms from "@/components/Forms";
import { MiniPieChart } from "@/components/charts";
import { Target } from "./types";
import { TargetValue } from "./TargetValue";
import classNames from "classnames";
import { PrimaryButton } from "@/components/Buttons";

interface Props {
  target: Target;
  index: number;
  targetOpen: string | undefined;
  setTargetOpen: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export function EditTargetCard({ target, index, setTargetOpen, targetOpen }: Props) {
  const editing = targetOpen === target.id;
  const containerClass = classNames(
    "relative py-2 mb-2",
    editing ? "px-3" : "pl-3 pr-5",
    "grid grid-cols-[1fr_auto] items-center gap-x-3",
    "last:mb-0 border border-surface-outline rounded",
    "bg-surface-base",
  );

  return (
    <div className={containerClass}>
      <TitleSection target={target} index={index} editing={editing} />
      {!editing && (
        <IconPencil
          onClick={() => setTargetOpen(target.id!)}
          className="absolute right-0.5 top-0.5 rounded-full hover:bg-surface-accent cursor-pointer hover:text-accent-1 transition-colors"
          size={16}
        />
      )}

      <DetailsSection index={index} toggleEditing={() => setTargetOpen(undefined)} editing={editing} />
    </div>
  );
}

function TitleSection({ target, index, editing }) {
  const className = classNames("flex items-center gap-2 truncate", { "col-span-2": target.isNew });

  return (
    <>
      <div className={className}>
        <PieChart target={target} />
        <NameField target={target} index={index} editing={editing} />
      </div>
      {!target.isNew && <TargetValue readonly index={index} target={target} />}
    </>
  );
}

function DetailsSection({ index, editing, toggleEditing }) {
  if (!editing) return null;

  return (
    <div className="col-span-2 mt-2">
      <Forms.FieldGroup layout="grid" layoutOptions={{ columns: 3 }}>
        <Forms.NumberInput placeholder="30" label="Start" field={`targets[${index}].from`} />
        <Forms.NumberInput placeholder="15" label="Target" field={`targets[${index}].to`} />
        <Forms.TextInput placeholder="minutes" label="Unit" field={`targets[${index}].unit`} />
      </Forms.FieldGroup>
      <div className="mt-2">
        <PrimaryButton size="sm" onClick={toggleEditing}>
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}

function NameField({ index, editing, target }: { index: number; target: Target; editing: boolean }) {
  if (!editing) {
    return <div className="font-medium truncate">{target.name}</div>;
  } else {
    return (
      <div className="w-full relative">
        <Forms.FieldGroup>
          <Forms.TextInput
            placeholder="e.g. Average Onboarding Time is twice as fast"
            field={`targets[${index}].name`}
          />
        </Forms.FieldGroup>
      </div>
    );
  }
}

function PieChart({ target }: { target: Target }) {
  const progress = Goals.targetProgressPercentage(target);

  if (target.isNew) return null;
  return <MiniPieChart completed={progress} total={100} size={16} />;
}
