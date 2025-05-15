import React from "react";
import { SecondaryButton } from "../Button";
import { MiniWorkMap } from "../MiniWorkMap";
import { GoalPage } from ".";
import { SectionHeader } from "./SectionHeader";

export function RelatedWork(props: GoalPage.Props) {
  if (props.relatedWorkItems.length === 0 && !props.canEdit) return null;

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

      {props.relatedWorkItems.length > 0 ? <RelatedWorkContent {...props} /> : <RelatedWorkZeroState />}
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

function RelatedWorkZeroState() {
  return (
    <div className="mt-1">
      <div className="text-content-dimmed text-sm">Break down the work on this goal into subgoals and projects.</div>
    </div>
  );
}
