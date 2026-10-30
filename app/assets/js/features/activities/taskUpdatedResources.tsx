import type * as Api from "@/api";
import { useLocale } from "@/contexts/TimezoneContext";
import type { Activity } from "@/models/activities";
import * as Activities from "@/models/activities";
import type { Paths } from "@/routes/paths";
import * as React from "react";
import { ActivityResourceList, type ActivityResourceEntry } from "turboui";
import i18n from "@/i18n";

export function UpdatedTaskList({ activity, paths }: { activity: Activity; paths: Paths }) {
  const locale = useLocale();
  return <ActivityResourceList entries={updatedTasksForFeed(activity, paths)} locale={locale} />;
}

export function hasAggregatedTasks(activity: Activity): boolean {
  return Activities.getAggregatedActivities(activity).length > 1;
}

export function updatedTasksForFeed(activity: Activity, paths: Paths): ActivityResourceEntry[] {
  const seen = new Set<string>();
  return Activities.getAggregatedActivities(activity)
    .slice()
    .sort((a, b) => (a.insertedAt || "").localeCompare(b.insertedAt || ""))
    .map((activity, index) => updatedTask(activity, paths, index))
    .filter((task): task is ActivityResourceEntry => task !== null)
    .filter((task) => {
      if (seen.has(task.key)) return false;
      seen.add(task.key);
      return true;
    });
}

function updatedTask(activity: Activity, paths: Paths, index: number): ActivityResourceEntry | null {
  const fallbackKey = `activity:${activity.id ?? index}`;
  if (activity.action === "task_deleting") {
    const content = activity.content as Api.ActivityContentTaskDeleting;
    return { key: fallbackKey, name: content.taskName };
  }
  if (activity.action === "task_moving") {
    const content = activity.content as Api.ActivityContentTaskMoving;
    const task = content.task;
    const path = !task?.id
      ? undefined
      : content.destinationType === "project" && content.destinationProject?.id
        ? paths.taskPath(task.id)
        : content.destinationType === "space" && content.destinationSpace?.id
          ? paths.spaceKanbanPath(content.destinationSpace.id, { taskId: task.id })
          : undefined;
    return { key: task?.id ?? fallbackKey, name: task?.name ?? content.taskName, path };
  }
  if (activity.action === "task_milestone_updating") {
    const content = activity.content as Api.ActivityContentTaskMilestoneUpdating;
    return {
      key: content.task?.id ?? fallbackKey,
      name: content.task?.name ?? i18n.t("task"),
      path: content.task?.id && content.project?.id ? paths.taskPath(content.task.id) : undefined,
    };
  }
  if (activity.action === "task_archive_updating") {
    const content = activity.content as Api.ActivityContentTaskArchiveUpdating;
    return {
      key: content.task?.id ?? fallbackKey,
      name: content.task?.name ?? content.name,
      path: taskPath(content, paths),
    };
  }

  const content = taskUpdateContent(activity);
  if (!content?.task?.id) return null;
  const path = taskPath(content, paths);
  if (!path) return null;
  return { key: content.task.id, name: content.task.name, path };
}

function taskPath(
  content: { task: Api.Task | null; project?: Api.Project | null; space?: Api.Space | null },
  paths: Paths,
) {
  if (!content.task?.id) return undefined;
  // Preserve the original five consumers' project-presence semantics.
  if (content.project) return paths.taskPath(content.task.id);
  if (content.space?.id) return paths.spaceKanbanPath(content.space.id, { taskId: content.task.id });
  return undefined;
}

function taskUpdateContent(activity: Activity) {
  switch (activity.action) {
    case "task_adding":
      return activity.content as Api.ActivityContentTaskAdding;
    case "task_assignee_updating":
      return activity.content as Api.ActivityContentTaskAssigneeUpdating;
    case "task_due_date_updating":
      return activity.content as Api.ActivityContentTaskDueDateUpdating;
    case "task_name_updating":
      return activity.content as Api.ActivityContentTaskNameUpdating;
    case "task_status_updating":
      return activity.content as Api.ActivityContentTaskStatusUpdating;
    default:
      return undefined;
  }
}
