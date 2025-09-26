import React from "react";
import { TaskPage } from ".";
import { Timeline } from "../Timeline";
import { PageDescription } from "../PageDescription";

export function Overview(props: TaskPage.State) {
  return (
    <div className="space-y-12 sm:col-span-8 sm:pr-8">
      <PageDescription
        {...props}
        label="Notes"
        placeholder="Describe the task..."
        zeroStatePlaceholder="Add notes about this task..."
      />
      <ActivitySection {...props} />
    </div>
  );
}

function ActivitySection(props: TaskPage.State) {
  if (props.timelineItems && props.currentUser) {
    return (
      <div data-test-id="task-activity-section">
        <h3 className="font-bold mb-4">Comments & Activity</h3>
        <Timeline
          items={props.timelineItems}
          currentUser={props.currentUser}
          canComment={props.canComment ?? true}
          commentParentType="task"
          onAddComment={props.onAddComment}
          onEditComment={props.onEditComment}
          richTextHandlers={props.richTextHandlers}
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
