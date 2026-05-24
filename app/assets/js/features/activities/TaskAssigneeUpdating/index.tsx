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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const { project, space, task } = content(activity);
    const message = feedMessage(content(activity));
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
    const { oldAssignee, newAssignee, addedAssignees, removedAssignees } = content(activity);
    const added = addedAssignees || [];
    const removed = removedAssignees || [];

    if (!newAssignee && added.length !== 1) return null;

    return (
      <div className="flex items-center gap-2">
        {removed.length > 1 ? (
          <span>Previously assigned to {removed.length} people</span>
        ) : oldAssignee ? (
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
    const { task } = content(props.activity);
    const taskName = task ? `Task "${task.name}"` : "A task";

    return `${taskName} was ${notificationMessage(content(props.activity))}`;
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

function feedMessage(content: ActivityContentTaskAssigneeUpdating): string {
  const added = content.addedAssignees || [];
  const removed = content.removedAssignees || [];
  const [addedAssignee] = added;
  const [removedAssignee] = removed;

  if (addedAssignee && added.length === 1 && removed.length === 0)
    return `assigned to ${addedAssignee.fullName} the task`;
  if (removedAssignee && removed.length === 1 && added.length === 0)
    return `unassigned ${removedAssignee.fullName} from the task`;
  if (added.length > 0 && removed.length > 0) return "changed assignees on the task";
  if (added.length > 1) return `assigned ${added.length} people to the task`;
  if (removed.length > 1) return `unassigned ${removed.length} people from the task`;

  if (content.newAssignee) return `assigned to ${content.newAssignee.fullName} the task`;
  if (content.oldAssignee) return `unassigned ${content.oldAssignee.fullName} from the task`;

  return "updated assignees on the task";
}

function notificationMessage(content: ActivityContentTaskAssigneeUpdating): string {
  const added = content.addedAssignees || [];
  const removed = content.removedAssignees || [];
  const [addedAssignee] = added;
  const [removedAssignee] = removed;

  if (addedAssignee && added.length === 1 && removed.length === 0) return `assigned to ${addedAssignee.fullName}`;
  if (removedAssignee && removed.length === 1 && added.length === 0)
    return `no longer assigned to ${removedAssignee.fullName}`;
  if (added.length > 0 || removed.length > 0) return "updated with new assignees";

  if (content.newAssignee) return `assigned to ${content.newAssignee.fullName}`;

  return "unassigned";
}

export default TaskAssigneeUpdating;
