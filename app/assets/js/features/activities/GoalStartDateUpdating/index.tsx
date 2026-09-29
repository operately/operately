import type { ActivityContentGoalStartDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { FormattedTime } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const GoalStartDateUpdating: ActivityHandler = {
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
    const { goal, newStartDate } = content(props.activity);

    const sentence =
      props.page === "goal"
        ? newStartDate
          ? i18n.t("{{author}} changed the start date to <date/>")
          : i18n.t("{{author}} cleared the start date")
        : newStartDate
          ? i18n.t("{{author}} changed the start date to <date/> on the <goal>{{goalName}}</goal>")
          : i18n.t("{{author}} cleared the start date on the <goal>{{goalName}}</goal>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(props.activity), goalName: goal.name }}
        components={{
          goal: goalLink(paths, goal),
          date: newStartDate ? (
            <FormattedTime {...formattedTimePreferences} time={newStartDate} format="short-date" />
          ) : (
            <React.Fragment />
          ),
        }}
      />
    );
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    const formattedTimePreferences = useFormattedTimePreferences();
    const { oldStartDate } = content(props.activity);

    if (oldStartDate) {
      const time = <FormattedTime {...formattedTimePreferences} time={oldStartDate} format="short-date" />;

      return <Trans i18nKey="Previously the start date was <date/>" components={{ date: time }} />;
    } else {
      return <Trans i18nKey="Previously had no start date" />;
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

function content(activity: Activity): ActivityContentGoalStartDateUpdating {
  return activity.content as ActivityContentGoalStartDateUpdating;
}

export default GoalStartDateUpdating;
