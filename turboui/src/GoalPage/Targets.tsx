import * as React from "react";

import { GoalPage } from ".";
import { SecondaryButton } from "../Button";
import { GoalTargetList } from "../GoalTargetList";
import { SectionHeader } from "./SectionHeader";

export function Targets(props: GoalPage.State) {
  const [addActive, setAddActive] = React.useState(false);

  return (
    <div>
      <SectionHeader
        title="Targets"
        buttons={
          <SecondaryButton size="xxs" onClick={() => setAddActive(true)} testId="add-target">
            Add
          </SecondaryButton>
        }
        showButtons={props.permissions.canEditTarget && !addActive}
      />

      {Boolean(!addActive && props.targets.length === 0) && (
        <div className="mt-1">
          <div className="text-content-dimmed text-sm">
            {props.permissions.canEditTarget
              ? "Add targets to track quantitative progress with numbers."
              : "The champion hasn't yet set targets for this goal."}
          </div>
        </div>
      )}

      <div className="mt-3">
        <GoalTargetList
          targets={props.targets}
          showEditButton={props.permissions.canEditTarget}
          showUpdateButton={props.permissions.canEditTarget}
          addActive={addActive}
          onAddActiveChange={(active) => setAddActive(active)}
          addTarget={props.addTarget}
          deleteTarget={props.deleteTarget}
          updateTarget={props.updateTarget}
          updateTargetValue={props.updateTargetValue}
          updateTargetIndex={props.updateTargetIndex}
        />
      </div>
    </div>
  );
}
