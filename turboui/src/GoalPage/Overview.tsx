import React from "react";

import { DocsAndFilesPreview } from "../DocsAndFiles";
import { GoalPage } from ".";
import { WarningCallout } from "../Callouts";
import { Checklists } from "./Checklists";
import { Contributors } from "./Contributors";
import { RelatedWork } from "./RelatedWork";
import { Sidebar } from "./Sidebar";
import { Targets } from "./Targets";
import { PageDescription } from "../PageDescription";

export function Overview(props: GoalPage.State) {
  return (
    <div className="p-4 max-w-6xl mx-auto my-6">
      <div className="sm:grid sm:grid-cols-12">
        <MainContent {...props} />
        <Sidebar {...props} />
      </div>
    </div>
  );
}

function MainContent(props: GoalPage.State) {
  return (
    <div className="space-y-12 sm:col-span-8 sm:pr-8">
      <Warnings {...props} />
      <PageDescription
        {...props}
        canEdit={props.permissions.canEdit}
        label="Goal description"
        placeholder="Describe the goal..."
        zeroStatePlaceholder="Describe the goal to provide context and clarity."
        localDraftKey={props.localDraftKeyBase ? `${props.localDraftKeyBase}:description` : undefined}
      />
      <Targets {...props} />
      <Checklists {...props} />
      <RelatedWork {...props} />
      {props.docsAndFiles && (
        <div className="pt-8 mt-8 border-t border-surface-outline">
          <ResourcesSection {...props} />
        </div>
      )}
      <Contributors {...props} />
    </div>
  );
}

function ResourcesSection(props: GoalPage.State) {
  if (!props.docsAndFiles) return null;

  return (
    <DocsAndFilesPreview
      nodes={props.docsAndFiles.previewNodes}
      tabPath={props.docsAndFiles.tabPath}
      getNodePath={props.docsAndFiles.nodesListProps.getNodePath}
    />
  );
}

function Warnings(props: GoalPage.State) {
  if (props.state == "closed") return null;

  if (props.neglectedGoal) {
    return <NeglectedGoalWarning {...props} />;
  }

  return null;
}

function NeglectedGoalWarning(props: GoalPage.State) {
  if (props.permissions.canEdit) {
    return (
      <WarningCallout
        message="Outdated goal"
        description={<div>The last check-in was more than a month ago. Please check-in or close the goal.</div>}
      />
    );
  } else {
    return (
      <WarningCallout
        message="Outdated goal"
        description={
          <div>
            The last check-in was more than a month ago. The information may be outdated. Please ping the champion
            check-in or close the goal.
          </div>
        }
      />
    );
  }
}
