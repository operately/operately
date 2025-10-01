import * as React from "react";

import type { ActivityContentProjectTaskCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { Link, Summary } from "turboui";
import { feedTitle, projectLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ProjectTaskCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { task, project } = content(activity);
    const path = task ? paths.taskPath(task.id) : paths.projectPath(project.id);

    return path;
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
    const { project, task } = content(activity);

    const taskPath = task ? paths.taskPath(task.id) : null;
    const taskLink = (taskPath && task) ? <Link to={taskPath}>{task.name}</Link> : "a task";

    if (page === "project") {
      return feedTitle(activity, "commented on", taskLink);
    } else {
      return feedTitle(activity, "commented on", taskLink, "in the", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const { comment } = content(activity);
    const commentContent = comment?.content ? JSON.parse(comment.content)["message"] : "";

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
