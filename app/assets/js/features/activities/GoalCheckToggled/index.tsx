import type { ActivityContentGoalCheckToggled } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const GoalCheckToggled: ActivityHandler = {
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
    const completed = content(props.activity).completed;
    const sentence =
      props.page === "goal"
        ? completed
          ? i18n.t("{{author}} marked a checklist item as completed")
          : i18n.t("{{author}} marked a checklist item as pending")
        : completed
          ? i18n.t("{{author}} marked a checklist item as completed on <goal>{{goalName}}</goal>")
          : i18n.t("{{author}} marked a checklist item as pending on <goal>{{goalName}}</goal>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(props.activity), goalName: goal.name }}
        components={{ goal: goalLink(paths, goal) }}
      />
    );
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    return <Trans i18nKey="Item: {{name}}" values={{ name: content(props.activity).name }} />;
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

function content(activity: Activity): ActivityContentGoalCheckToggled {
  return activity.content as ActivityContentGoalCheckToggled;
}

export default GoalCheckToggled;
