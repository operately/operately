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
}

export function EditTargetCard({ target, index }: Props) {
  const [editing, setEditing] = React.useState(false);
  const progress = Goals.targetProgressPercentage(target);

  const toggleEditing = () => setEditing(!editing);

  const containerClass = classNames(
    "relative py-2 px-3 mb-2",
    "grid grid-cols-[1fr_auto] items-center gap-x-3",
    "last:mb-0 border border-surface-outline rounded",
    editing ? "bg-surface-base" : "bg-surface-accent",
  );

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2 truncate">
        <MiniPieChart completed={progress} total={100} size={16} />
        <NameField target={target} index={index} editing={editing} />
      </div>
      <div className="mr-2">
        <TargetValue readonly index={index} target={target} />
      </div>
      {!editing && (
        <IconPencil
          onClick={toggleEditing}
          className="absolute right-0.5 top-0.5 rounded-full hover:bg-surface-accent cursor-pointer hover:text-accent-1 transition-colors"
          size={16}
        />
      )}

      <DetailsSection index={index} toggleEditing={toggleEditing} editing={editing} />
    </div>
  );
}

function DetailsSection({ index, editing, toggleEditing }) {
  if (!editing) return null;

  return (
    <div className="col-span-2 mt-2">
      <Forms.FieldGroup layout="grid" layoutOptions={{ columns: 3 }}>
        <Forms.NumberInput label="Start" field={`targets[${index}].from`} />
        <Forms.NumberInput label="Target" field={`targets[${index}].to`} />
        <Forms.TextInput label="Unit" field={`targets[${index}].unit`} />
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
          <Forms.TextInput field={`targets[${index}].name`} />
        </Forms.FieldGroup>
      </div>
    );
  }
}
