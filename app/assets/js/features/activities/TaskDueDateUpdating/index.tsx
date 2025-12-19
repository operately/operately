import type { ActivityContentTaskDueDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { DateDisplay } from "turboui";
import { feedTitle, projectLink, spaceLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { parseContextualDate } from "@/models/contextualDates";

const TaskDueDateUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity): string {
    const { project, space, task } = content(activity);

    if (project && task) {
      return paths.taskPath(task.id);
    }

    if (project) {
      return paths.projectPath(project.id, "tasks");
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

  FeedItemTitle(props: { activity: Activity; page: string }) {
    const { taskName, task, project, space, newDueDate } = content(props.activity);

    const message = newDueDate ? "changed the due date to " : "cleared the due date";
    const location = project ? projectLink(project) : spaceLink(space);

    const taskElement = (() => {
      if (task) return taskLink(task, { spaceId: !project ? space.id : undefined });
      if (taskName) return taskName;
      return "a task";
    })();
    
    if (newDueDate) {
      // When showing a date, need to include the DateField component after the message
      const dateField = <DateDisplay date={parseContextualDate(newDueDate)} />;

      if (props.page === "project") {
        return feedTitle(props.activity, message, dateField, "on", taskElement);
      } else if (props.page === "space" && !project) {
        return feedTitle(props.activity, message, dateField, "on", taskElement);
      } else {
        return feedTitle(props.activity, message, dateField, "on", taskElement, "in", location);
      }
    } else {
      // For cleared date, no DateField needed
      if (props.page === "project") {
        return feedTitle(props.activity, message, "on", taskElement);
      } else if (props.page === "space" && !project) {
        return feedTitle(props.activity, message, "on", taskElement);
      } else {
        return feedTitle(props.activity, message, "on", taskElement, "in", location);
      }
    }
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    const { oldDueDate } = content(props.activity);

    if (oldDueDate) {
      return (
        <span>Previously the due date was <DateDisplay date={parseContextualDate(oldDueDate)} /></span>
      );
    } else {
      return <>Previously had no due date</>;
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

  NotificationTitle(props: { activity: Activity }) {
    const { task, taskName, newDueDate } = content(props.activity);
    const name = taskName || task?.name || "a task";
    
    if (newDueDate) {
      return (
        <span>Updated due date for {name} to <DateDisplay date={parseContextualDate(newDueDate)} /></span>
      );
    } else {
      return <span>Cleared due date for {name}</span>;
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project, space } = content(props.activity);

    if (project) {
      return project.name;
    }

    return space.name;
  },
};

function content(activity: Activity): ActivityContentTaskDueDateUpdating {
  return activity.content as ActivityContentTaskDueDateUpdating;
}

export default TaskDueDateUpdating;
