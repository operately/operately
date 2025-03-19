import { useFieldValue } from "@/components/Forms/FormContext";
import { IconPlus } from "@tabler/icons-react";
import React from "react";
import { Target } from "./types";

interface Props {
  field: string;
  display: boolean;
  setTargetOpen: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export function AddTargetButton({ field, display, setTargetOpen }: Props) {
  const [targets, setTargets] = useFieldValue<Target[]>(field);

  if (!display) return null;

  const handleClick = () => {
    const target = newEmptyTarget();
    setTargets([...targets, target]);
    setTargetOpen(target.id!);
  };

  return (
    <div
      className="py-2 px-3 border border-surface-outline bg-surface-base rounded cursor-pointer hover:bg-surface-dimmed"
      onClick={handleClick}
      data-test-id="add-target"
    >
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 text-content-dimmed font-medium">
          <IconPlus size={16} className="text-content-dimmed shrink-0" />
          Add target
        </div>
      </div>
    </div>
  );
}

function newEmptyTarget(): Target {
  return {
    isNew: true,
    id: Math.random().toString(),
    name: "",
    from: 0,
    to: 0,
    unit: "",
  };
}
