import * as React from "react";
import * as People from "@/models/people";

import type { ActivityContentGoalCheckInAcknowledgement } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, goalLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";

const GoalCheckInAcknowledgement: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.goalProgressUpdatePath(content(activity).update!.id!);
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
    const goal = content(activity).goal!;
    const update = content(activity).update!;

    const path = Paths.goalProgressUpdatePath(update.id!);
    const link = <Link to={path}>Progress Update</Link>;

    if (page === "goal") {
      return feedTitle(activity, "acknowledged the", link);
    } else {
      return feedTitle(activity, "acknowledged the", link, "in the", goalLink(goal), "goal");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " acknowledged your progress update";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalCheckInAcknowledgement {
  return activity.content as ActivityContentGoalCheckInAcknowledgement;
}

export default GoalCheckInAcknowledgement;
