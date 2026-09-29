import React from "react";

import type { ActivityContentGoalTargetAdding } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const GoalTargetAdding: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_paths: Paths, _activity: Activity) {
    throw new Error("Not implemented");
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

  FeedItemTitle(props: FeedItemProps) {
    const { paths } = props;
    const goal = content(props.activity).goal!;
    const targetName = content(props.activity).targetName!;

    if (props.page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} added the {{targetName}} target"
          values={{ author: activityAuthorName(props.activity), targetName }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} added the {{targetName}} target to <goal>{{goalName}}</goal>"
          values={{ author: activityAuthorName(props.activity), targetName, goalName: goal.name }}
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

  NotificationTitle(_props: { activity: Activity }) {
    return <></>;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentGoalTargetAdding {
  return activity.content as ActivityContentGoalTargetAdding;
}

export default GoalTargetAdding;
