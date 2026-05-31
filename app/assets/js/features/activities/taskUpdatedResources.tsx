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
import { usePaths } from "@/routes/paths";
import * as React from "react";
import { Link } from "turboui";

interface UpdatedTask {
  key: string;
  name: string;
  path: string;
}

interface ListPart {
  type: "element" | "literal";
  value: string;
}

export function UpdatedTaskList({ activity }: { activity: Activity }) {
  const paths = usePaths();
  const locale = useLocale();
  const tasks = updatedTasksForFeed(activity, paths);
  const parts = listParts(tasks.length, locale);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "literal") return <React.Fragment key={index}>{part.value}</React.Fragment>;

        const task = tasks[Number(part.value)];
        if (!task) return null;

        return (
          <Link key={task.key} to={task.path}>
            {task.name}
          </Link>
        );
      })}
    </>
  );
}

export function hasAggregatedTasks(activity: Activity): boolean {
  return Activities.getAggregatedActivities(activity).length > 1;
}

function updatedTasksForFeed(activity: Activity, paths: ReturnType<typeof usePaths>): UpdatedTask[] {
  const seen = new Set<string>();

  return Activities.getAggregatedActivities(activity)
    .slice()
    .sort((a, b) => (a.insertedAt || "").localeCompare(b.insertedAt || ""))
    .map((activity) => updatedTask(activity, paths))
    .filter((task): task is UpdatedTask => task !== null)
    .filter((task) => {
      if (seen.has(task.key)) return false;

      seen.add(task.key);
      return true;
    });
}

function updatedTask(activity: Activity, paths: ReturnType<typeof usePaths>): UpdatedTask | null {
  const data = taskUpdateContent(activity);
  const task = data?.task;
  const project = data?.project;
  const space = data?.space;

  if (!task?.id) return null;

  let path: string;

  if (project) {
    path = paths.taskPath(task.id);
  } else if (space?.id) {
    path = paths.spaceKanbanPath(space.id, { taskId: task.id });
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

function listParts(count: number, locale: string): ListPart[] {
  const items = Array.from({ length: count }, (_, index) => String(index));
  const listFormat = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });

  return listFormat.formatToParts(items).map((part) => ({
    type: part.type === "element" ? "element" : "literal",
    value: part.value,
  }));
}
