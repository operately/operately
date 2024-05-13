import React from "react";

import { Paths } from "@/routes/paths";
import type { Activity, ActivityContentGoalCheckIn } from "@/models/activities";

export default {
  pagePath(activity: Activity): string {
    const content = activity.content as ActivityContentGoalCheckIn;
    return Paths.goalCheckInPath(content.goal.id, content.update.id);
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal Check-In</>;
  },

  PageContent(_props: { activity: Activity }) {
    return "Hello";
  },

  FeedItemContent(_props: { activity: Activity }) {
    return "Hello";
  },

  FeedItemTitle(_props: { activity: Activity }) {
    return "Hello";
  },

  hasComments(activity: Activity): boolean {
    return false;
  },
};
