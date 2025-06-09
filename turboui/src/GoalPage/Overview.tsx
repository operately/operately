import React from "react";

import { GoalPage } from ".";
import { WarningCallout } from "../Callouts";
import { isOverdue } from "../utils/time";
import { Contributors } from "./Contributors";
import { Description } from "./Description";
import { RelatedWork } from "./RelatedWork";
import { Sidebar } from "./Sidebar";
import { Targets } from "./Targets";

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
      <Description {...props} />
      <Targets {...props} />
      <RelatedWork {...props} />
      <Contributors {...props} />
    </div>
  );
}

function Warnings(props: GoalPage.State) {
  if (props.state == "closed") return null;

  if (props.dueDate && isOverdue(props.dueDate)) {
    return <OverdueWarning {...props} />;
  }

  if (props.neglectedGoal) {
    return <NeglectedGoalWarning {...props} />;
  }

  return null;
}

function NeglectedGoalWarning(props: GoalPage.State) {
  if (props.canEdit) {
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

function OverdueWarning(props: GoalPage.State) {
  if (props.canEdit) {
    return (
      <WarningCallout
        message="Overdue goal"
        description={<div>This goal is overdue. Close it or update the due date.</div>}
      />
    );
  } else {
    return (
      <WarningCallout
        message="Overdue goal"
        description={
          <div>
            This goal is overdue. The information may be outdated. Please ping the champion to check-in or update.
          </div>
        }
      />
    );
  }
}
