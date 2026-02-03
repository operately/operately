import React from "react";

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
      />
      <Targets {...props} />
      <Checklists {...props} />
      <RelatedWork {...props} />
      <Contributors {...props} />
    </div>
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
