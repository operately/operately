import type { ActivityContentGoalDueDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { FormattedTime } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const GoalDueDateUpdating: ActivityHandler = {
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
    const formattedTimePreferences = useFormattedTimePreferences();
    const { goal, newDueDate } = content(props.activity);

    const sentence =
      props.page === "goal"
        ? newDueDate
          ? i18n.t("{{author}} changed the due date to <date/>")
          : i18n.t("{{author}} cleared the due date")
        : newDueDate
          ? i18n.t("{{author}} changed the due date to <date/> on the <goal>{{goalName}}</goal>")
          : i18n.t("{{author}} cleared the due date on the <goal>{{goalName}}</goal>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(props.activity), goalName: goal.name }}
        components={{
          goal: goalLink(paths, goal),
          date: newDueDate ? (
            <FormattedTime {...formattedTimePreferences} time={newDueDate} format="short-date" />
          ) : (
            <React.Fragment />
          ),
        }}
      />
    );
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    const formattedTimePreferences = useFormattedTimePreferences();
    const { oldDueDate } = content(props.activity);

    if (oldDueDate) {
      const time = <FormattedTime {...formattedTimePreferences} time={oldDueDate} format="short-date" />;

      return <Trans i18nKey="Previously the due date was <date/>" components={{ date: time }} />;
    } else {
      return <Trans i18nKey="Previously had no due date" />;
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

  NotificationTitle(_props: { activity: Activity }) {
    return <></>;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentGoalDueDateUpdating {
  return activity.content as ActivityContentGoalDueDateUpdating;
}

export default GoalDueDateUpdating;
