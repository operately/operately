import { SecondaryButton } from "../Button";
import { GoalTargetList } from "../GoalTargetList";
import { GoalPage } from ".";
import { SectionHeader } from "./SectionHeader";

export function Targets(props: GoalPage.Props) {
  return (
    <div>
      <SectionHeader
        title="Targets"
        buttons={<SecondaryButton size="xxs">Add</SecondaryButton>}
        showButtons={props.canEdit && props.targets.length > 0}
      />

      {props.targets.length === 0 ? <ZeroState {...props} /> : <TargetsList {...props} />}
    </div>
  );
}

function ZeroState(props: GoalPage.Props) {
  return (
    <div className="mt-1">
      <div className="text-content-dimmed text-sm">
        {props.canEdit
          ? "Add targets to measure progress and celebrate wins."
          : "The champion didn't yet set targets for this goal."}
      </div>

      {props.canEdit && (
        <div className="mt-2">
          <SecondaryButton size="xs">Add first target</SecondaryButton>
        </div>
      )}
    </div>
  );
}

function TargetsList(props: GoalPage.Props) {
  return (
    <div className="mt-3">
      <GoalTargetList targets={props.targets} showEditButton={props.canEdit} />
    </div>
  );
}
