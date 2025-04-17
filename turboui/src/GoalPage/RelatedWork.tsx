import { SecondaryButton } from "../Button";
import { MiniWorkMap } from "../MiniWorkMap";
import { GoalPage } from ".";
import { SectionHeader } from "./SectionHeader";

export function RelatedWork(props: GoalPage.Props) {
  return (
    <div>
      <SectionHeader
        title="Related Work"
        buttons={
          <div className="flex items-center gap-2">
            <SecondaryButton size="xxs">Add subgoal</SecondaryButton>
            <SecondaryButton size="xxs">Add project</SecondaryButton>
          </div>
        }
        showButtons={props.relatedWorkItems.length > 0}
      />

      {props.relatedWorkItems.length > 0 ? <RelatedWorkContent {...props} /> : <RelatedWorkZeroState {...props} />}
    </div>
  );
}

function RelatedWorkContent(props: GoalPage.Props) {
  return (
    <div className="mt-4">
      <MiniWorkMap items={props.relatedWorkItems} />
    </div>
  );
}

function RelatedWorkZeroState(props: GoalPage.Props) {
  return (
    <div className="mt-1">
      <div className="text-content-dimmed text-sm">
        {props.canEdit
          ? "Break down the work on this goal into subgoals and projects."
          : "Connections to supporting projects and subgoals will appear here."}
      </div>

      {props.canEdit && (
        <div className="mt-2 flex items-center gap-2">
          <SecondaryButton size="xs">Add subgoal</SecondaryButton>
          <SecondaryButton size="xs">Add project</SecondaryButton>
        </div>
      )}
    </div>
  );
}
