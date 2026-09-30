import * as People from "@/models/people";
import React from "react";

import type { ActivityContentGoalChampionUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const GoalChampionUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
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
    const goal = content(activity).goal!;
    const newChampion = content(activity).newChampion;
    const sentence =
      page === "goal"
        ? newChampion
          ? i18n.t("{{author}} assigned {{personName}} as the champion")
          : i18n.t("{{author}} removed the champion")
        : newChampion
          ? i18n.t("{{author}} assigned {{personName}} as the champion on <goal>{{goalName}}</goal>")
          : i18n.t("{{author}} removed the champion on <goal>{{goalName}}</goal>");
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          personName: newChampion ? People.shortName(newChampion) : "",
          goalName: goal.name,
        }}
        components={{ goal: goalLink(paths, goal) }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const oldChampion = content(activity).oldChampion;

    if (oldChampion) {
      return (
        <Trans
          i18nKey="Previously, {{personName}} was the champion."
          values={{ personName: People.shortName(oldChampion) }}
        />
      );
    } else {
      return <Trans i18nKey="There was no previous champion." />;
    }
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

  NotificationTitle(props: { activity: Activity }) {
    return i18n.t("{{author}} assigned you as the champion", { author: activityAuthorName(props.activity) });
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalChampionUpdating {
  return activity.content as ActivityContentGoalChampionUpdating;
}

export default GoalChampionUpdating;
