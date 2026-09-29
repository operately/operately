import type { ActivityContentProjectDueDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import React from "react";
import { FormattedTime } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const ProjectDueDateUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    return paths.projectPath(content(activity).project!.id!);
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
    const { project, newDueDate } = content(props.activity);

    const sentence =
      props.page === "project"
        ? newDueDate
          ? i18n.t("{{author}} changed the due date to <date/>")
          : i18n.t("{{author}} cleared the due date")
        : newDueDate
          ? i18n.t("{{author}} changed the due date to <date/> on the <project>{{projectName}}</project>")
          : i18n.t("{{author}} cleared the due date on the <project>{{projectName}}</project>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(props.activity), projectName: project?.name }}
        components={{
          project: project ? projectLink(paths, project) : <React.Fragment />,
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

  NotificationTitle({ activity }: { activity: Activity }) {
    const formattedTimePreferences = useFormattedTimePreferences();
    const { project, newDueDate } = content(activity);
    const projectName = project?.name ?? i18n.t("the project");

    if (newDueDate) {
      return (
        <Trans
          i18nKey="Updated due date for {{projectName}} to <date/>"
          values={{ projectName }}
          components={{ date: <FormattedTime {...formattedTimePreferences} time={newDueDate} format="short-date" /> }}
        />
      );
    } else {
      return <Trans i18nKey="Cleared due date for {{projectName}}" values={{ projectName }} />;
    }
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const { space } = content(activity);
    return space?.name || null;
  },
};

function content(activity: Activity): ActivityContentProjectDueDateUpdating {
  return activity.content as ActivityContentProjectDueDateUpdating;
}

export default ProjectDueDateUpdating;
