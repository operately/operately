import React from "react";
import { TaskPage } from ".";
import { Description } from "./Description";
import { Timeline } from "../Timeline";

export function Overview(props: TaskPage.State) {
  return (
    <div className="space-y-12 sm:col-span-8 sm:pr-8">
      <Description {...props} />
      <ActivitySection {...props} />
    </div>
  );
}

function ActivitySection(props: TaskPage.State) {
  // Use timeline data if provided, otherwise show placeholder
  if (props.timelineItems && props.currentUser) {
    return (
      <div>
        <h3 className="font-bold mb-4">Comments & Activity</h3>
        <Timeline
          items={props.timelineItems}
          currentUser={props.currentUser}
          canComment={props.canComment ?? true}
          commentParentType="task"
          onAddComment={props.onAddComment}
          onEditComment={props.onEditComment}
          mentionedPersonLookup={props.mentionedPersonLookup}
          peopleSearch={props.peopleSearch}
          filters={props.timelineFilters}
        />
      </div>
    );
  }

  // Fallback for when timeline data is not provided
  return (
    <div>
      <h3 className="font-bold mb-4">Comments & Activity</h3>
      <div className="text-content-dimmed text-center py-8">Timeline data not available</div>
    </div>
  );
}
