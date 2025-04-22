import { SecondaryButton } from "../Button";
import { MiniWorkMap } from "../MiniWorkMap";
import { GoalPage } from ".";
import { SectionHeader } from "./SectionHeader";

export function RelatedWork(props: GoalPage.Props) {
  return (
    <div>
      <SectionHeader
        title="Subgoals & Projects"
        buttons={
          <div className="flex items-center gap-2">
            <SecondaryButton size="xxs" onClick={() => {}}>
              Add goal
            </SecondaryButton>
            <SecondaryButton size="xxs" onClick={() => {}}>
              Add project
            </SecondaryButton>
          </div>
        }
        showButtons={props.canEdit}
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
    </div>
  );
}
