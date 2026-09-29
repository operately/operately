import React from "react";

import { Activity, ActivityContentGoalReparent } from "@/api";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const GoalReparent: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const goalId = content(activity).goal?.id;

    return goalId ? paths.goalPath(goalId) : paths.workMapPath();
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
    const data = content(activity);
    const goal = data.goal ? goalLink(paths, data.goal) : null;

    if (page === "goal" || !goal) {
      return <Trans i18nKey="{{author}} changed the parent goal" values={{ author: activityAuthorName(activity) }} />;
    } else {
      return (
        <Trans
          i18nKey="{{author}} changed the parent goal of <goal>{{goalName}}</goal>"
          values={{ author: activityAuthorName(activity), goalName: data.goal?.name }}
          components={{ goal }}
        />
      );
    }
  },

  FeedItemContent(props: FeedItemProps) {
    const { paths } = props;
    const { newParentGoal, oldParentGoal } = content(props.activity);

    const oldParentLink = oldParentGoal ? goalLink(paths, oldParentGoal) : <React.Fragment />;
    const newParentLink = newParentGoal ? goalLink(paths, newParentGoal) : <React.Fragment />;

    if (newParentGoal && oldParentGoal) {
      return (
        <Trans
          i18nKey="Changed the parent goal from <old>{{oldName}}</old> to <new>{{newName}}</new>."
          values={{ oldName: oldParentGoal.name, newName: newParentGoal.name }}
          components={{ old: oldParentLink, new: newParentLink }}
        />
      );
    }

    if (newParentGoal) {
      return (
        <Trans
          i18nKey="Changed the parent goal to <goal>{{goalName}}</goal>."
          values={{ goalName: newParentGoal.name }}
          components={{ goal: newParentLink }}
        />
      );
    }

    if (oldParentGoal) {
      return (
        <Trans
          i18nKey="Removed the parent goal <goal>{{goalName}}</goal>."
          values={{ goalName: oldParentGoal.name }}
          components={{ goal: oldParentLink }}
        />
      );
    }

    return <Trans i18nKey="No parent goal was set." />;
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
    const goalName = content(activity).goal?.name;

    return goalName
      ? i18n.t("Changed the parent goal of {{goalName}}", { goalName })
      : i18n.t("Changed a goal's parent goal");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const data = content(activity);

    return data.goal?.name ?? data.newParentGoal?.name ?? data.oldParentGoal?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentGoalReparent {
  return activity.content as ActivityContentGoalReparent;
}

export default GoalReparent;
