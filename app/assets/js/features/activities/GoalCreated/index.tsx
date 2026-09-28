import React from "react";
import { Trans } from "react-i18next";
import i18n from "@/i18n";
import { usePaths } from "@/routes/paths";
import * as People from "@/models/people";

import type { ActivityContentGoalCreated } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { match } from "ts-pattern";
import { activityAuthorName, goalLink } from "../feedItemLinks";

const GoalCreated: ActivityHandler = {
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
    const goal = content(activity).goal;

    if (page === "goal") {
      return <Trans i18nKey="{{author}} added this goal" values={{ author: activityAuthorName(activity) }} />;
    }

    if (!goal) {
      return <Trans i18nKey="{{author}} added a goal" values={{ author: activityAuthorName(activity) }} />;
    }

    return (
      <Trans
        i18nKey="{{author}} added the <goal>{{goalName}}</goal> goal"
        values={{ author: activityAuthorName(activity), goalName: goal.name }}
        components={{ goal: goalLink(paths, goal) }}
      />
    );
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
    const myRole = content(activity).goal!.myRole!;
    const person = People.firstName(activity.author!);
    return match(myRole)
      .with("champion", () => i18n.t("{{person}} added a new goal and assigned you as the champion", { person }))
      .with("reviewer", () => i18n.t("{{person}} added a new goal and assigned you as the reviewer", { person }))
      .otherwise(() => i18n.t("{{person}} added a new goal and assigned you as a contributor", { person }));
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const paths = usePaths();
    return goalLink(paths, content(activity).goal!);
  },
};

function content(activity: Activity): ActivityContentGoalCreated {
  return activity.content as ActivityContentGoalCreated;
}

export default GoalCreated;
