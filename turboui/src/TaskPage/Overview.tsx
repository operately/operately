import React from "react";
import { TaskPage } from ".";
import { Description } from "./Description";

export function Overview(props: TaskPage.State) {
  return (
    <div className="space-y-12 sm:col-span-8 sm:pr-8">
      <Description {...props} />
      <CommentsPlaceholder />
    </div>
  );
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
