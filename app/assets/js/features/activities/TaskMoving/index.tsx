import type { Paths } from "@/routes/paths";
import React from "react";
import type { ActivityContentTaskMoving } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink, spaceLink, taskLink } from "../feedItemLinks";

const TaskMoving: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    const task = data.task;

    if (data.destinationType === "space") {
      if (data.destinationSpace?.id && task?.id)
        return paths.spaceKanbanPath(data.destinationSpace.id, { taskId: task.id });
      if (data.destinationSpace?.id) return paths.spaceKanbanPath(data.destinationSpace.id);
      return paths.homePath();
    }

    if (task?.id) return paths.taskPath(task.id);
    if (data.destinationProject?.id) return paths.projectPath(data.destinationProject.id, { tab: "tasks" });

    return paths.homePath();
  },

  PageTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, paths }: FeedItemProps) {
    const data = content(activity);
    const movedTask =
      data.task && data.destinationType === "space" && data.destinationSpace?.id ? (
        taskLink(paths, data.task, { spaceId: data.destinationSpace.id })
      ) : data.task ? (
        taskLink(paths, data.task)
      ) : (
        <React.Fragment />
      );
    const values = {
      author: activityAuthorName(activity),
      taskName: data.task?.name ?? data.taskName,
      destinationName:
        data.destinationProject?.name ??
        data.destinationSpace?.name ??
        (data.destinationType === "project" ? i18n.t("a project") : i18n.t("a space")),
    };
    const components = { task: movedTask, destination: destinationLabel(paths, data) };
    return data.task ? (
      <Trans
        i18nKey="{{author}} moved the task <task>{{taskName}}</task> to <destination>{{destinationName}}</destination>"
        values={values}
        components={components}
      />
    ) : (
      <Trans
        i18nKey={'{{author}} moved the task "{{taskName}}" to <destination>{{destinationName}}</destination>'}
        values={values}
        components={components}
      />
    );
  },

  FeedItemContent({ activity, paths }: FeedItemProps) {
    const data = content(activity);

    return (
      <Trans
        i18nKey="Previously, it was in <origin>{{originName}}</origin>"
        values={{
          originName:
            data.originProject?.name ??
            data.originSpace?.name ??
            (data.originType === "project" ? i18n.t("a project") : i18n.t("a space")),
        }}
        components={{ origin: originLabel(paths, data) }}
      />
    );
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    const data = content(activity);
    return i18n.t('Moved task "{{taskName}}" to {{destinationName}}', {
      taskName: data.taskName,
      destinationName: destinationName(data),
    });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return destinationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentTaskMoving {
  return activity.content as ActivityContentTaskMoving;
}

function originLabel(paths: Paths, data: ActivityContentTaskMoving) {
  if (data.originProject) return projectLink(paths, data.originProject);
  if (data.originSpace) return spaceLink(paths, data.originSpace);
  return <React.Fragment />;
}

function destinationLabel(paths: Paths, data: ActivityContentTaskMoving) {
  if (data.destinationProject) return projectLink(paths, data.destinationProject);
  if (data.destinationSpace) return spaceLink(paths, data.destinationSpace);
  return <React.Fragment />;
}

function destinationName(data: ActivityContentTaskMoving) {
  return data.destinationProject?.name || data.destinationSpace?.name || i18n.t("another destination");
}

export default TaskMoving;
