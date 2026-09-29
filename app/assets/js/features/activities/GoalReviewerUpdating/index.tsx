import * as People from "@/models/people";
import React from "react";

import type { ActivityContentGoalReviewerUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const GoalReviewerUpdating: ActivityHandler = {
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
    const newReviewer = content(activity).newReviewer;
    const sentence =
      page === "goal"
        ? newReviewer
          ? i18n.t("{{author}} assigned {{personName}} as the reviewer")
          : i18n.t("{{author}} removed the reviewer")
        : newReviewer
          ? i18n.t("{{author}} assigned {{personName}} as the reviewer on <goal>{{goalName}}</goal>")
          : i18n.t("{{author}} removed the reviewer on <goal>{{goalName}}</goal>");
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          personName: newReviewer ? People.shortName(newReviewer) : "",
          goalName: goal.name,
        }}
        components={{ goal: goalLink(paths, goal) }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const oldReviewer = content(activity).oldReviewer;

    if (oldReviewer) {
      return (
        <Trans
          i18nKey="Previously, {{personName}} was the reviewer."
          values={{ personName: People.shortName(oldReviewer) }}
        />
      );
    } else {
      return <Trans i18nKey="There was no previous reviewer." />;
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
    return i18n.t("{{author}} assigned you as the reviewer", { author: activityAuthorName(props.activity) });
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalReviewerUpdating {
  return activity.content as ActivityContentGoalReviewerUpdating;
}

export default GoalReviewerUpdating;
