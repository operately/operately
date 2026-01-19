import React from "react";

import type { ActivityContentTaskAssigneeUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, projectLink, spaceLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { AvatarWithName } from "turboui";

const TaskAssigneeUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { project, space, task } = content(activity);

    if (project && task) {
      return paths.taskPath(task.id);
    }

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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const { project, space, task, newAssignee, oldAssignee } = content(activity);

    const assigneeText = (() => {
      if (newAssignee) return `assigned to ${newAssignee.fullName}`;
      if (oldAssignee) return `unassigned ${oldAssignee.fullName} from`;
      return "unassigned";
    })();

    const message = `${assigneeText} the task`;
    const taskName = task ? taskLink(task, { spaceId: !project ? space.id : undefined }) : "a task";
    const location = project ? projectLink(project) : spaceLink(space);

    if (page === "project") {
      return feedTitle(activity, message, taskName);
    } else if (page === "space" && !project) {
      return feedTitle(activity, message, taskName);
    } else {
      return feedTitle(activity, message, taskName, "in", location);
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { oldAssignee, newAssignee } = content(activity);

    if (!newAssignee) return null;

    return (
      <div className="flex items-center gap-2">
        {oldAssignee ? (
          <>
            <span>Previously assigned to:</span>
            <div className="flex items-center gap-1">
              <AvatarWithName person={oldAssignee} size="tiny" />
            </div>
          </>
        ) : (
          <span>Previously it was unassigned</span>
        )}
      </div>
    );
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
    const { task, newAssignee } = content(props.activity);
    const assigneeText = newAssignee ? `assigned to ${newAssignee.fullName}` : "unassigned";
    const taskName = task ? `Task "${task.name}"` : "A task";

    return `${taskName} was ${assigneeText}`;
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project, space } = content(props.activity);

    if (project) {
      return project.name;
    }

    return space.name;
  },
};

function content(activity: Activity): ActivityContentTaskAssigneeUpdating {
  return activity.content as ActivityContentTaskAssigneeUpdating;
}

export default TaskAssigneeUpdating;
