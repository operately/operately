import type { ActivityContentTaskDueDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { DateField } from "turboui";
import { feedTitle, taskLink, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { parseContextualDate } from "@/models/contextualDates";

const TaskDueDateUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity): string {
    const data = content(activity);
    return paths.taskPath(data.task!.id!);
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
    const { taskName, task, project, newDueDate } = content(props.activity);

    const message = newDueDate ? "changed the due date to " : "cleared the due date";

    // Get the task element - either a link or plain text
    let taskElement;
    if (task) {
      taskElement = taskLink(task);
    } else if (taskName) {
      taskElement = taskName;
    } else {
      taskElement = "a task";
    }

    const projectElement = project ? ` in ${projectLink(project)}` : "";

    if (newDueDate) {
      // When showing a date, need to include the DateField component after the message
      const dateField = (
        <span style={{ display: "inline-flex" }}>
          <DateField date={parseContextualDate(newDueDate)} readonly hideCalendarIcon />
        </span>
      );

      if (props.page === "project") {
        return feedTitle(props.activity, message, dateField, " on", taskElement);
      } else {
        return feedTitle(props.activity, message, dateField, " on", taskElement, projectElement);
      }
    } else {
      // For cleared date, no DateField needed
      if (props.page === "project") {
        return feedTitle(props.activity, message, " on", taskElement);
      } else {
        return feedTitle(props.activity, message, " on", taskElement, projectElement);
      }
    }
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    const { oldDueDate } = content(props.activity);

    if (oldDueDate) {
      return (
        <span>
          Previously the due date was{" "}
          <span style={{ display: "inline-flex" }}>
            <DateField date={parseContextualDate(oldDueDate)} readonly hideCalendarIcon />
          </span>
        </span>
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
        <span>
          Updated due date for {name} to{" "}
          <span style={{ display: "inline-flex" }}>
            <DateField date={parseContextualDate(newDueDate)} readonly hideCalendarIcon />
          </span>
        </span>
      );
    } else {
      return <span>Cleared due date for {name}</span>;
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project } = content(props.activity);
    return project?.name || null;
  },
};

function content(activity: Activity): ActivityContentTaskDueDateUpdating {
  return activity.content as ActivityContentTaskDueDateUpdating;
}

export default TaskDueDateUpdating;
