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
        <h3 className="text-lg font-semibold mb-4">Activity & Discussion</h3>
        <Timeline
          items={props.timelineItems}
          currentUser={props.currentUser}
          canComment={props.canComment ?? true}
          commentParentType="task"
          onAddComment={props.onAddComment}
          onEditComment={props.onEditComment}
          filters={props.timelineFilters}
        />
      </div>
    );
  }

  return <CommentsPlaceholder />;
}

function CommentsPlaceholder() {
  return (
    <div className="border border-surface-outline rounded-lg p-6 bg-surface-dimmed">
      <div className="text-center text-content-subtle">
        <div className="text-sm font-medium mb-1">Comments & Activity</div>
        <div className="text-xs">This section will contain the task's activity feed and comments</div>
      </div>
    </div>
  );
}
