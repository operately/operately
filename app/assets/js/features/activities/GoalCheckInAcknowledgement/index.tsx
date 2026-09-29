import * as React from "react";

import type { ActivityContentGoalCheckInAcknowledgement } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Link } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";

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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const goal = content(activity).goal!;
    const update = content(activity).update!;

    const path = paths.goalCheckInPath(update.id!);
    const link = <Link to={path}>{null}</Link>;

    if (page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} acknowledged the <checkIn>Check-In</checkIn>"
          values={{ author: activityAuthorName(activity) }}
          components={{ checkIn: link }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} acknowledged the <checkIn>Check-In</checkIn> in the <goal>{{goalName}}</goal> goal"
          values={{ author: activityAuthorName(activity), goalName: goal.name }}
          components={{ checkIn: link, goal: goalLink(paths, goal) }}
        />
      );
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
    return i18n.t("Acknowledged check-in");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalCheckInAcknowledgement {
  return activity.content as ActivityContentGoalCheckInAcknowledgement;
}

export default GoalCheckInAcknowledgement;
