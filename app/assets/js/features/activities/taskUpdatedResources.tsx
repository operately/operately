import { spaceTaskPath } from "./feedItemLinks";
import type {
  ActivityContentTaskAssigneeUpdating,
  ActivityContentTaskDueDateUpdating,
  ActivityContentTaskAdding,
  ActivityContentTaskNameUpdating,
  ActivityContentTaskStatusUpdating,
} from "@/api";
import { useLocale } from "@/contexts/TimezoneContext";
import type { Activity } from "@/models/activities";
import * as Activities from "@/models/activities";
import type { Paths } from "@/routes/paths";
import * as React from "react";
import { ActivityTaskList, type ActivityTaskListEntry } from "turboui";

export function UpdatedTaskList({ activity, paths }: { activity: Activity; paths: Paths }) {
  const locale = useLocale();
  const tasks = updatedTasksForFeed(activity, paths);
  return <ActivityTaskList tasks={tasks} locale={locale} />;
}

export function hasAggregatedTasks(activity: Activity): boolean {
  return Activities.getAggregatedActivities(activity).length > 1;
}

function updatedTasksForFeed(activity: Activity, paths: Paths): ActivityTaskListEntry[] {
  const seen = new Set<string>();

  return Activities.getAggregatedActivities(activity)
    .slice()
    .sort((a, b) => (a.insertedAt || "").localeCompare(b.insertedAt || ""))
    .map((activity) => updatedTask(activity, paths))
    .filter((task): task is ActivityTaskListEntry => task !== null)
    .filter((task) => {
      if (seen.has(task.key)) return false;

      seen.add(task.key);
      return true;
    });
}

function updatedTask(activity: Activity, paths: Paths): ActivityTaskListEntry | null {
  const data = taskUpdateContent(activity);
  const task = data?.task;
  const project = data?.project;
  const space = data?.space;

  if (!task?.id) return null;

  let path: string;

  if (project) {
    path = paths.taskPath(task.id);
  } else if (space?.id) {
    path = spaceTaskPath(paths, space.id, task);
  } else {
    return null;
  }

  return {
    key: task.id,
    name: task.name,
    path,
  };
}

function taskUpdateContent(
  activity: Activity,
):
  | ActivityContentTaskAssigneeUpdating
  | ActivityContentTaskDueDateUpdating
  | ActivityContentTaskAdding
  | ActivityContentTaskNameUpdating
  | ActivityContentTaskStatusUpdating
  | undefined {
  switch (activity.action) {
    case "task_adding":
      return activity.content as ActivityContentTaskAdding;
    case "task_assignee_updating":
      return activity.content as ActivityContentTaskAssigneeUpdating;
    case "task_due_date_updating":
      return activity.content as ActivityContentTaskDueDateUpdating;
    case "task_name_updating":
      return activity.content as ActivityContentTaskNameUpdating;
    case "task_status_updating":
      return activity.content as ActivityContentTaskStatusUpdating;
    default:
      return undefined;
  }
}
