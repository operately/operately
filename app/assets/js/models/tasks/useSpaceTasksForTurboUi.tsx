import * as React from "react";

import Api, { type TaskStatus, type TasksCreateInput } from "@/api";
import * as Tasks from "./index";

import { usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { serializeContextualDate } from "../contextualDates";

import { DateField, showErrorToast, TaskBoard } from "turboui";

interface Attrs {
  backendTasks: Tasks.Task[];
  spaceId: string;
  cacheKey: string;
  refresh?: () => Promise<void>;
}

interface TasksSnapshot {
  tasks: TaskBoard.Task[];
}

export function useSpaceTasksForTurboUi({ backendTasks, spaceId, cacheKey, refresh }: Attrs) {
  const paths = usePaths();
  const [tasks, setTasks] = React.useState(Tasks.parseTasksForTurboUi(paths, backendTasks, "space"));

  React.useEffect(() => {
    setTasks(Tasks.parseTasksForTurboUi(paths, backendTasks, "space"));
  }, [backendTasks, paths]);

  const createSnapshot = React.useCallback(
    (): TasksSnapshot => ({
      tasks: [...tasks],
    }),
    [tasks],
  );

  const restoreSnapshot = React.useCallback((snapshot: TasksSnapshot) => {
    setTasks(snapshot.tasks);
  }, []);

  const invalidateAndRefresh = React.useCallback(async () => {
    PageCache.invalidate(cacheKey);

    if (refresh) {
      await refresh();
    }
  }, [cacheKey, refresh]);

  const createTask = async (task: TaskBoard.NewTaskPayload) => {
    const snapshot = createSnapshot();
    const tempId = `temp-${Date.now()}`;

    const optimisticTask: TaskBoard.Task = {
      id: tempId,
      title: task.title,
      description: "",
      link: "#",
      status: task.status ?? null,
      assignees: task.assignee ? [{ id: task.assignee, fullName: "Loading...", avatarUrl: "" }] : [],
      dueDate: task.dueDate || null,
      milestone: null,
      type: "space",
    };

    setTasks((prev) => [...prev, optimisticTask]);

    try {
      const backendStatus: TaskStatus | null = Tasks.serializeTaskStatus(task.status ?? null);

      const input: TasksCreateInput = {
        name: task.title,
        assigneeId: task.assignee,
        dueDate: serializeContextualDate(task.dueDate),
        milestoneId: null,
        id: spaceId,
        type: "space",
      };

      if (backendStatus !== null) {
        input.status = backendStatus;
      }

      const res = await Api.tasks.create(input);

      const realTask = Tasks.parseTaskForTurboUi(paths, res.task, "space");
      setTasks((prev) => prev.map((t) => (t.id === tempId ? realTask : t)));

      await invalidateAndRefresh();

      return { success: true };
    } catch (e) {
      console.error("Failed to create task", e);
      showErrorToast("Error", "Failed to create task");
      restoreSnapshot(snapshot);
      return { success: false };
    }
  };

  const updateTaskName = async (taskId: string, name: string) => {
    const snapshot = createSnapshot();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, title: name };
        }
        return t;
      }),
    );

    try {
      await Api.tasks.updateName({ taskId, name, type: "space" });
      await invalidateAndRefresh();

      return { success: true };
    } catch (e) {
      console.error("Failed to update task name", e);
      showErrorToast("Error", "Failed to update task name");
      restoreSnapshot(snapshot);
      return { success: false };
    }
  };

  const updateTaskDueDate = async (taskId: string, dueDate: DateField.ContextualDate | null) => {
    const snapshot = createSnapshot();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, dueDate };
        }
        return t;
      }),
    );

    try {
      await Api.tasks.updateDueDate({ taskId, dueDate: serializeContextualDate(dueDate), type: "space" });
      await invalidateAndRefresh();

      return { success: true };
    } catch (e) {
      console.error("Failed to update task due date", e);
      showErrorToast("Error", "Failed to update task due date");
      restoreSnapshot(snapshot);
      return { success: false };
    }
  };

  const updateTaskAssignee = async (taskId: string, assignee: TaskBoard.Person | null) => {
    const snapshot = createSnapshot();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, assignees: assignee ? [assignee] : [] };
        }
        return t;
      }),
    );

    try {
      await Api.tasks.updateAssignee({ taskId, assigneeId: assignee?.id || null, type: "space" });
      await invalidateAndRefresh();

      return { success: true };
    } catch (e) {
      console.error("Failed to update task assignee", e);
      showErrorToast("Error", "Failed to update task assignee");
      restoreSnapshot(snapshot);
      return { success: false };
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskBoard.Status | null) => {
    const snapshot = createSnapshot();
    const backendStatus: TaskStatus | null = Tasks.serializeTaskStatus(status);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, status };
        }
        return t;
      }),
    );

    try {
      const response = await Api.tasks.updateStatus({ taskId, status: backendStatus, type: "space" });

      const updatedTask = Tasks.parseTaskForTurboUi(paths, response.task, "space");
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: updatedTask.status } : t)));

      await invalidateAndRefresh();

      return { success: true };
    } catch (e) {
      console.error("Failed to update task status", e);
      showErrorToast("Error", "Failed to update task status");
      restoreSnapshot(snapshot);
      return { success: false };
    }
  };

  const deleteTask = async (taskId: string) => {
    const snapshot = createSnapshot();

    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await Api.tasks.delete({ taskId, type: "space" });

      await invalidateAndRefresh();
    } catch (e) {
      console.error("Failed to delete task", e);
      showErrorToast("Error", "Failed to delete task");
      restoreSnapshot(snapshot);
    }
  };

  const updateTaskDescription = async (taskId: string, description: any) => {
    try {
      const serializedDescription = description ? JSON.stringify(description) : "";

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, description: serializedDescription ?? "" };
          }
          return t;
        }),
      );

      await Api.tasks.updateDescription({ taskId, description: serializedDescription, type: "space" });
      await invalidateAndRefresh();

      return true;
    } catch (e) {
      console.error("Failed to update task description", e);
      showErrorToast("Error", "Failed to update task description");
      return false;
    }
  };

  return {
    tasks,
    setTasks,
    createTask,
    updateTaskName,
    updateTaskDueDate,
    updateTaskAssignee,
    updateTaskStatus,
    deleteTask,
    updateTaskDescription,
  };
}
