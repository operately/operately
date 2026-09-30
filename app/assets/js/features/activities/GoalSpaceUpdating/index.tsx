import React from "react";

import type { ActivityContentGoalSpaceUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import { activityAuthorName, goalLink, spaceLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const GoalSpaceUpdating: ActivityHandler = {
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
    const space = content(props.activity).space!;

    return (
      <Trans
        i18nKey="{{author}} moved the <goal>{{goalName}}</goal> goal to <space>{{spaceName}}</space>"
        values={{ author: activityAuthorName(props.activity), goalName: goal.name, spaceName: space.name }}
        components={{ goal: goalLink(paths, goal), space: spaceLink(paths, space) }}
      />
    );
  },

  FeedItemContent(props: FeedItemProps) {
    const { paths } = props;
    const space = content(props.activity).oldSpace!;

    return (
      <Trans
        i18nKey="Previously, it was in the <space>{{spaceName}}</space> space."
        values={{ spaceName: space.name }}
        components={{ space: spaceLink(paths, space) }}
      />
    );
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

function content(activity: Activity): ActivityContentGoalSpaceUpdating {
  return activity.content as ActivityContentGoalSpaceUpdating;
}

export default GoalSpaceUpdating;
