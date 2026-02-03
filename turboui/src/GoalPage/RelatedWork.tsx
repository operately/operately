import React from "react";
import { GoalPage } from ".";
import { SecondaryButton } from "../Button";
import { MiniWorkMap } from "../MiniWorkMap";
import { SectionHeader } from "./SectionHeader";

export function RelatedWork(props: GoalPage.State) {
  const spaceProps = "space" in props ? props : null;
  const canAddRelatedWork = props.permissions.canEdit && Boolean(spaceProps);

  if (props.relatedWorkItems.length === 0 && !canAddRelatedWork) return null;

  const buttons = canAddRelatedWork && spaceProps ? (
    <div className="flex items-center gap-2">
      <SecondaryButton size="xxs" linkTo={spaceProps.addSubgoalLink} testId="add-subgoal">
        Add goal
      </SecondaryButton>
      <SecondaryButton size="xxs" linkTo={spaceProps.addSubprojectLink}>
        Add project
      </SecondaryButton>
    </div>
  ) : null;

  return (
    <div data-test-id="related-work-section">
      <SectionHeader
        title="Subgoals & Projects"
        buttons={buttons}
        showButtons={canAddRelatedWork}
      />

      {props.relatedWorkItems.length > 0 ? <RelatedWorkContent {...props} /> : <RelatedWorkZeroState />}
    </div>
  );
}

function RelatedWorkContent(props: GoalPage.State) {
  return (
    <div className="mt-4">
      <MiniWorkMap items={props.relatedWorkItems} />
    </div>
  );
}

function RelatedWorkZeroState() {
  return (
    <div className="mt-1">
      <div className="text-content-dimmed text-sm">Break down the work on this goal into subgoals and projects.</div>
    </div>
  );
}
