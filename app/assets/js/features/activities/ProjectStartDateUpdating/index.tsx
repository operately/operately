import type { ActivityContentProjectStartDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { FormattedTime } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { Trans } from "../i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const ProjectStartDateUpdating: ActivityHandler = {
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
    const { project, newStartDate } = content(props.activity);

    const values = { author: activityAuthorName(props.activity), projectName: project?.name };
    const components = {
      project: project ? projectLink(paths, project) : <React.Fragment />,
      date: newStartDate ? (
        <FormattedTime {...formattedTimePreferences} time={newStartDate} format="short-date" />
      ) : (
        <React.Fragment />
      ),
    };

    if (props.page === "project") {
      return newStartDate ? (
        <Trans
          i18nKey="{{author}} changed the start date to <date/>"
          values={values}
          components={{ date: components.date }}
        />
      ) : (
        <Trans i18nKey="{{author}} cleared the start date" values={values} />
      );
    } else {
      return newStartDate ? (
        <Trans
          i18nKey="{{author}} changed the start date to <date/> on the <project>{{projectName}}</project>"
          values={values}
          components={components}
        />
      ) : (
        <Trans
          i18nKey="{{author}} cleared the start date on the <project>{{projectName}}</project>"
          values={values}
          components={components}
        />
      );
    }
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

function content(activity: Activity): ActivityContentProjectStartDateUpdating {
  return activity.content as ActivityContentProjectStartDateUpdating;
}

export default ProjectStartDateUpdating;
