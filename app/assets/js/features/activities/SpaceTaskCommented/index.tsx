import * as React from "react";

import type { ActivityContentSpaceTaskCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link, Summary } from "turboui";
import { feedTitle, spaceLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const SpaceTaskCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { task, space } = content(activity);

    if (task) {
      return paths.spaceKanbanPath(space.id, { taskId: task.id });
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const { space, task } = content(activity);

    const taskPath = task ? paths.spaceKanbanPath(space.id, { taskId: task.id }) : paths.spaceKanbanPath(space.id);
    const taskLink = task ? <Link to={taskPath}>{task.name}</Link> : "a task";

    if (page === "space") {
      return feedTitle(activity, "commented on", taskLink);
    } else {
      return feedTitle(activity, "commented on", taskLink, "in the", spaceLink(space), "space");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const { comment } = content(activity);

    if (!comment?.content) {
      return null;
    }

    const commentContent = comment?.content ? JSON.parse(comment.content)["message"] : null;

    if (!commentContent) {
      return null;
    }

    return <Summary content={commentContent} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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
    const taskName = task ? task.name : "a task";
    return "Re: " + taskName;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space.name;
  },
};

function content(activity: Activity): ActivityContentSpaceTaskCommented {
  return activity.content as ActivityContentSpaceTaskCommented;
}

export default SpaceTaskCommented;
