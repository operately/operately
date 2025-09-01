import * as React from "react";

import Api from "@/api";
import * as Tasks from "./index";

import { usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { serializeContextualDate } from "../contextualDates";

import { DateField, showErrorToast, TaskBoard } from "turboui";
import { parseMilestoneForTurboUi, parseMilestonesForTurboUi } from "../milestones";

export function useTasksForTurboUi(
  backendTasks: Tasks.Task[],
  projectId: string,
  cacheKey: string,
  setMilestones?: React.Dispatch<React.SetStateAction<TaskBoard.Milestone[]>>,
) {
  const paths = usePaths();
  const [tasks, setTasks] = React.useState(Tasks.parseTasksForTurboUi(paths, backendTasks));

  React.useEffect(() => {
    setTasks(Tasks.parseTasksForTurboUi(paths, backendTasks));
  }, [backendTasks, paths]);

  const createTask = async (task: TaskBoard.NewTaskPayload) => {
    return Api.project_tasks
      .create({
        name: task.title,
        assigneeId: task.assignee,
        dueDate: serializeContextualDate(task.dueDate),
        milestoneId: task.milestone?.id || null,
        projectId: projectId,
      })
      .then((data) => {
        PageCache.invalidate(cacheKey);

        setTasks((prev) => [...prev, Tasks.parseTaskForTurboUi(paths, data.task)]);

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to create task", e);
        showErrorToast("Error", "Failed to create task");

        return { success: false };
      });
  };

  const updateTaskDueDate = async (taskId: string, dueDate: DateField.ContextualDate | null) => {
    return Api.project_tasks
      .updateDueDate({ taskId, dueDate: serializeContextualDate(dueDate) })
      .then(() => {
        PageCache.invalidate(cacheKey);

        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return { ...t, dueDate };
            }
            return t;
          }),
        );

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to update task due date", e);
        showErrorToast("Error", "Failed to update task due date");

        return { success: false };
      });
  };

  const updateTaskAssignee = async (taskId: string, assignee: TaskBoard.Person | null) => {
    return Api.project_tasks
      .updateAssignee({ taskId, assigneeId: assignee?.id || null })
      .then(() => {
        PageCache.invalidate(cacheKey);

        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return { ...t, assignee };
            }
            return t;
          }),
        );

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to update task assignee", e);
        showErrorToast("Error", "Failed to update task assignee");

        return { success: false };
      });
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    return Api.project_tasks
      .updateStatus({ taskId, status })
      .then(() => {
        PageCache.invalidate(cacheKey);

        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return { ...t, status: status as TaskBoard.Status };
            }
            return t;
          }),
        );

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to update task status", e);
        showErrorToast("Error", "Failed to update task status");

        return { success: false };
      });
  };

  const updateTaskMilestone = async (taskId: string, milestoneId: string, index: number) => {
    try {
      const data = await Api.project_tasks.updateMilestone({ taskId, milestoneId, index });

      PageCache.invalidate(cacheKey);

      const milestonesResponse = await Api.projects.getMilestones({ projectId: projectId });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, milestone: parseMilestoneForTurboUi(paths, data.task.milestone!) };
          }
          return t;
        }),
      );
      setMilestones?.(parseMilestonesForTurboUi(paths, milestonesResponse.milestones || []));

      return { success: true };
    } catch (e) {
      console.error("Failed to update task milestone", e);
      showErrorToast("Error", "Failed to update task milestone");

      return { success: false };
    }
  };

  return { tasks, createTask, updateTaskDueDate, updateTaskAssignee, updateTaskStatus, updateTaskMilestone };
}
