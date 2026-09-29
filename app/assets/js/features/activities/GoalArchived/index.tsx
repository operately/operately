import type { ActivityContentGoalArchived } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { assertPresent } from "@/utils/assertions";
import { activityAuthorName, goalLink } from "../feedItemLinks";

const GoalArchived: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalPath(content(activity).goal!.id!);
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
    if (page === "goal") {
      return <Trans i18nKey="{{author}} archived this goal" values={{ author: activityAuthorName(activity) }} />;
    } else {
      const goal = content(activity).goal;
      assertPresent(goal, "Goal is required for an archived activity");
      return (
        <Trans
          i18nKey="{{author}} archived the <goal>{{goalName}}</goal> goal"
          values={{ author: activityAuthorName(activity), goalName: goal.name }}
          components={{ goal: goalLink(paths, goal) }}
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return i18n.t("Archived the {{goalName}} goal", { goalName: content(activity).goal?.name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalArchived {
  return activity.content as ActivityContentGoalArchived;
}

export default GoalArchived;
