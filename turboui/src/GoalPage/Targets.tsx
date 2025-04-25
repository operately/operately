import * as React from "react";

import { SecondaryButton } from "../Button";
import { GoalTargetList } from "../GoalTargetList";
import { GoalPage } from ".";
import { SectionHeader } from "./SectionHeader";

export function Targets(props: GoalPage.Props) {
  const [addActive, setAddActive] = React.useState(false);

  return (
    <div>
      <SectionHeader
        title="Targets"
        buttons={
          <SecondaryButton size="xxs" onClick={() => setAddActive(true)}>
            Add
          </SecondaryButton>
        }
        showButtons={props.canEdit && !addActive}
      />

      {props.targets.length === 0 ? (
        <div className="mt-1">
          <div className="text-content-dimmed text-sm">
            {props.canEdit
              ? "Add targets to measure progress and celebrate wins."
              : "The champion didn't yet set targets for this goal."}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <GoalTargetList
            targets={props.targets}
            showEditButton={props.canEdit}
            showUpdateButton={props.canEdit}
            addActive={addActive}
            onAddActiveChange={(active) => setAddActive(active)}
          />
        </div>
      )}
    </div>
  );
}
