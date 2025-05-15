import React from "react";
import { SecondaryButton } from "../Button";
import { State, TargetState } from "./useGoalTargetListState";

export function UpdateButton({ state, target }: { state: State; target: TargetState }) {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    state.startUpdating(target.id!);
  };

  return (
    <div className="mt-px">
      <SecondaryButton size="xxs" onClick={onClick}>
        Update
      </SecondaryButton>
    </div>
  );
}
