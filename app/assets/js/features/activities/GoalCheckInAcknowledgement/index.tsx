import * as React from "react";

import type { ActivityContentGoalCheckInAcknowledgement } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link } from "turboui";
import { feedTitle, goalLink } from "../feedItemLinks";

const GoalCheckInAcknowledgement: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalCheckInPath(content(activity).update!.id!);
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const goal = content(activity).goal!;
    const update = content(activity).update!;

    const path = paths.goalCheckInPath(update.id!);
    const link = <Link to={path}>Check-In</Link>;

    if (page === "goal") {
      return feedTitle(activity, "acknowledged the", link);
    } else {
      return feedTitle(activity, "acknowledged the", link, "in the", goalLink(goal), "goal");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_: { activity: Activity }) {
    return "Acknowledged check-in";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalCheckInAcknowledgement {
  return activity.content as ActivityContentGoalCheckInAcknowledgement;
}

export default GoalCheckInAcknowledgement;
