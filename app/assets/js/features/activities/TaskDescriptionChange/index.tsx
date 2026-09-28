import { Trans } from "react-i18next";
import i18n from "@/i18n";
import React from "react";

import type { ActivityContentTaskDescriptionChange } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { activityAuthorName, taskLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const TaskDescriptionChange: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { task, space } = content(activity);
    const isSpaceTask = task?.type === "space";

    if (isSpaceTask) {
      return space ? paths.spaceKanbanPath(space.id, { taskId: task.id }) : paths.homePath();
    } else {
      return task ? paths.taskPath(task.id) : paths.homePath();
    }
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
    const { task, projectName, space } = content(activity);
    const isSpaceTask = task?.type === "space";

    // Determine link and context
    const link = isSpaceTask
      ? space
        ? taskLink(paths, task, { spaceId: space.id })
        : task.name
      : task
        ? taskLink(paths, task)
        : null;

    // Add context suffix based on page view
    const shouldShowContext = (isSpaceTask && page !== "space") || (!isSpaceTask && page !== "project");
    const context = shouldShowContext ? (isSpaceTask ? space?.name : projectName) : undefined;

    if (!task) {
      return context ? (
        <Trans
          i18nKey="{{author}} updated the description of a task in {{context}}"
          values={{ author: activityAuthorName(activity), context }}
        />
      ) : (
        <Trans
          i18nKey="{{author}} updated the description of a task"
          values={{ author: activityAuthorName(activity) }}
        />
      );
    }

    return context ? (
      <Trans
        i18nKey="{{author}} updated the description of <task>{{taskName}}</task> in {{context}}"
        values={{ author: activityAuthorName(activity), context, taskName: task.name }}
        components={{ task: React.isValidElement(link) ? link : <></> }}
      />
    ) : (
      <Trans
        i18nKey="{{author}} updated the description of <task>{{taskName}}</task>"
        values={{ author: activityAuthorName(activity), taskName: task.name }}
        components={{ task: React.isValidElement(link) ? link : <></> }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    const rawDescription = data.description ?? data.task?.description;

    if (!rawDescription) return null;

    const description = typeof rawDescription === "string" ? JSON.parse(rawDescription) : rawDescription;

    return <Summary content={description} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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
    const { task } = content(activity);

    return task?.name
      ? i18n.t("Updated the description of: {{taskName}}", { taskName: task.name })
      : i18n.t("Updated the description of: a task");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).projectName;
  },
};

function content(activity: Activity): ActivityContentTaskDescriptionChange {
  return activity.content as ActivityContentTaskDescriptionChange;
}

export default TaskDescriptionChange;
