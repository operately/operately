import * as React from "react";

import type { ActivityContentGoalRetrospectiveAcknowledged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Link } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";

const GoalRetrospectiveAcknowledged: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalActivityPath(content(activity).retrospectiveId!);
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
    const path = paths.goalActivityPath(content(activity).retrospectiveId!);
    const link = <Link to={path}>{null}</Link>;

    if (page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} acknowledged the <retrospective>Retrospective</retrospective>"
          values={{ author: activityAuthorName(activity) }}
          components={{ retrospective: link }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} acknowledged the <retrospective>Retrospective</retrospective> in the <goal>{{goalName}}</goal> goal"
          values={{ author: activityAuthorName(activity), goalName: goal.name }}
          components={{ retrospective: link, goal: goalLink(paths, goal) }}
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
    return i18n.t("Acknowledged retrospective");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalRetrospectiveAcknowledged {
  return activity.content as ActivityContentGoalRetrospectiveAcknowledged;
}

export default GoalRetrospectiveAcknowledged;
