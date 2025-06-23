import { IconPencil } from "../icons";
import React from "react";
import { SecondaryButton } from "../Button";
import { createTestId } from "../TestableElement";
import { State, TargetState } from "./useGoalTargetListState";

export function EditButton({ state, target }: { state: State; target: TargetState }) {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    state.startEditing(target.id!);
  };

  return (
    <div className="mt-px">
      <SecondaryButton size="xxs" onClick={onClick} icon={IconPencil} testId={createTestId("edit-target", target.name)}>
        Edit
      </SecondaryButton>
    </div>
  );
}
