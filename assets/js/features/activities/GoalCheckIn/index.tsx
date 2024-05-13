import React from "react";
import RichContent from "@/components/RichContent";

import { Paths } from "@/routes/paths";
import type { Activity, ActivityContentGoalCheckIn } from "@/models/activities";

import { ConditionChanges } from "./ConditionChanges";

export default {
  pagePath(activity: Activity): string {
    const content = activity.content as ActivityContentGoalCheckIn;
    return Paths.goalCheckInPath(content.goal.id, content.update.id);
  },

  pageHtmlTitle(_activity: Activity): string {
    return "Goal Check-In";
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal Check-In</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    const content = activity.content as ActivityContentGoalCheckIn;

    return (
      <div className="flex flex-col gap-4">
        <RichContent jsonContent={content.update.message} />
        <ConditionChanges update={content.update} />
      </div>
    );
  },

  FeedItemContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  FeedItemTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  commentCount(activity: Activity): number {
    const content = activity.content as ActivityContentGoalCheckIn;
    return content.update.commentsCount;
  },

  hasComments(_activity: Activity): boolean {
    return true;
  },
};
