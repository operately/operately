import type { ActivityContentTaskDeleting } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { Trans } from "../i18n";
import { activityAuthorName, projectLink, spaceLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const TaskDeleting: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { project, space } = content(activity);

    if (project) {
      return paths.projectPath(project.id, { tab: "tasks" });
    }

    return paths.spaceKanbanPath(space.id);
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
    const { taskName, project, space } = content(props.activity);
    const location = project ? projectLink(paths, project) : spaceLink(paths, space);
    const values = { author: activityAuthorName(props.activity), taskName, locationName: project?.name ?? space.name };

    if (props.page === "project") {
      return <Trans i18nKey={'{{author}} deleted task "{{taskName}}"'} values={values} />;
    } else if (props.page === "space" && !project) {
      return <Trans i18nKey={'{{author}} deleted task "{{taskName}}"'} values={values} />;
    } else {
      return (
        <Trans
          i18nKey={'{{author}} deleted task "{{taskName}}" in <location>{{locationName}}</location>'}
          values={values}
          components={{ location }}
        />
      );
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null; // No additional content needed for deletion
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
    const { taskName } = content(props.activity);
    return <Trans i18nKey={'Task "{{taskName}}" was deleted'} values={{ taskName }} />;
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project, space } = content(props.activity);

    if (project) {
      return <Trans i18nKey="Project: {{projectName}}" values={{ projectName: project.name }} />;
    }
    return <Trans i18nKey="Space: {{spaceName}}" values={{ spaceName: space.name }} />;
  },
};

function content(activity: Activity): ActivityContentTaskDeleting {
  return activity.content as ActivityContentTaskDeleting;
}

export default TaskDeleting;
