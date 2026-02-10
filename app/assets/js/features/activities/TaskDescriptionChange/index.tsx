import React from "react";

import type { ActivityContentTaskDescriptionChange } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";
import { assertPresent } from "@/utils/assertions";
import { feedTitle, taskLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const TaskDescriptionChange: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    assertPresent(data.task?.id, "task must be present in activity");

    return paths.taskPath(data.task.id);
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const { task, projectName, space } = content(activity);
    const isSpaceTask = task?.type === "space";

    // Determine link and context
    const link = isSpaceTask
      ? space
        ? taskLink(task, { spaceId: space.id })
        : task.name
      : task
        ? taskLink(task)
        : "a task";

    // Add context suffix based on page view
    const shouldShowContext = (isSpaceTask && page !== "space") || (!isSpaceTask && page !== "project");
    const context = shouldShowContext ? (isSpaceTask ? space?.name : projectName) : undefined;

    return context
      ? feedTitle(activity, "updated the description of", link, "in", context)
      : feedTitle(activity, "updated the description of", link);
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

    return "Updated the description of: " + task?.name;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).projectName;
  },
};

function content(activity: Activity): ActivityContentTaskDescriptionChange {
  return activity.content as ActivityContentTaskDescriptionChange;
}

export default TaskDescriptionChange;
