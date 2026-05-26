import * as React from "react";

import type { ActivityContentProjectTaskCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link, Summary } from "turboui";
import { commentPath, commentedLink, feedTitle, projectLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const ProjectTaskCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { comment, task, project } = content(activity);

    return task ? commentPath(paths.taskPath(task.id), comment) : paths.projectPath(project.id);
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
    const { comment, project, task } = content(activity);

    const taskPath = task ? paths.taskPath(task.id) : null;
    const action = taskPath ? commentedLink(taskPath, comment) : "commented";
    const taskLink = taskPath && task ? <Link to={taskPath}>{task.name}</Link> : "a task";

    if (page === "project") {
      return feedTitle(activity, action, "on", taskLink);
    } else {
      return feedTitle(activity, action, "on", taskLink, "in the", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const { comment } = content(activity);

    if (!comment?.content) {
      return null;
    }

    const commentContent = parseCommentContent(comment.content);

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
    return content(activity).project.name;
  },
};

function content(activity: Activity): ActivityContentProjectTaskCommented {
  return activity.content as ActivityContentProjectTaskCommented;
}

export default ProjectTaskCommented;
