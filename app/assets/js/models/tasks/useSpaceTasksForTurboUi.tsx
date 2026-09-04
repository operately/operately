import * as React from "react";

import { type TaskStatus, type TasksCreateInput } from "@/api";
import * as Tasks from "./index";
import * as Spaces from "../spaces";
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTaskAssignee,
  useUpdateTaskDescription,
  useUpdateTaskDueDate,
  useUpdateTaskName,
  useUpdateTaskReminders,
  useUpdateTaskStatus,
} from "./taskLifecycle";

import { usePaths } from "@/routes/paths";
import { serializeContextualDate } from "../contextualDates";

import { DateField, showErrorToast, TaskBoard, TaskPage } from "turboui";
import { serializeTaskDescription } from "./descriptionSerialization";

interface Attrs {
  backendTasks: Tasks.Task[];
  space: Spaces.Space;
}

interface TasksSnapshot {
  tasks: TaskBoard.Task[];
}

export function useSpaceTasksForTurboUi({ backendTasks, space }: Attrs) {
  const paths = usePaths();
  const createTaskMutation = useCreateTask();
  const updateTaskNameMutation = useUpdateTaskName();
  const updateTaskDueDateMutation = useUpdateTaskDueDate();
  const updateTaskRemindersMutation = useUpdateTaskReminders();
  const updateTaskAssigneeMutation = useUpdateTaskAssignee();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask("active");
  const updateTaskDescriptionMutation = useUpdateTaskDescription();
  const [tasks, setTasks] = React.useState(Tasks.parseTasksForTurboUi(paths, backendTasks, { type: "space", space }));

  React.useEffect(() => {
    setTasks(Tasks.parseTasksForTurboUi(paths, backendTasks, { type: "space", space }));
  }, [backendTasks, paths, space.id]);

  const createSnapshot = React.useCallback(
    (): TasksSnapshot => ({
      tasks: [...tasks],
    }),
    [tasks],
  );

  const restoreSnapshot = React.useCallback((snapshot: TasksSnapshot) => {
    setTasks(snapshot.tasks);
  }, []);

  const createTask = async (task: TaskBoard.NewTaskPayload) => {
    const snapshot = createSnapshot();
    const tempId = `temp-${Date.now()}`;

    const optimisticTask: TaskBoard.Task = {
      id: tempId,
      title: task.title,
      description: serializeTaskDescription(task.description),
      link: "#",
      status: task.status ?? null,
      assignees: task.assignees,
      dueDate: task.dueDate || null,
      milestone: null,
      type: "space",
    };

    setTasks((prev) => [...prev, optimisticTask]);

    try {
      const backendStatus: TaskStatus | null = Tasks.serializeTaskStatus(task.status ?? null);

      const input: TasksCreateInput = {
        name: task.title,
        assigneeIds: task.assignees.map((assignee) => assignee.id),
        dueDate: serializeContextualDate(task.dueDate),
        milestoneId: null,
        id: space.id,
        type: "space",
      };

      const description = serializeTaskDescription(task.description);
      if (description) {
        input.description = description;
      }

      if (backendStatus !== null) {
        input.status = backendStatus;
      }

      const res = await createTaskMutation.mutateAsync(input);

      const realTask = Tasks.parseTaskForTurboUi(paths, res.task, { type: "space", space });
      setTasks((prev) => prev.map((t) => (t.id === tempId ? realTask : t)));

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
      await updateTaskNameMutation.mutateAsync({ taskId, name, type: "space" });

      return true;
    } catch (e) {
      console.error("Failed to update task name", e);
      showErrorToast("Error", "Failed to update task name");
      restoreSnapshot(snapshot);
      return false;
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
      await updateTaskDueDateMutation.mutateAsync({
        taskId,
        dueDate: serializeContextualDate(dueDate),
        type: "space",
      });

      return true;
    } catch (e) {
      console.error("Failed to update task due date", e);
      showErrorToast("Error", "Failed to update task due date");
      restoreSnapshot(snapshot);
      return false;
    }
  };

  const updateTaskReminders = async (taskId: string, reminders: TaskPage.Reminder[]) => {
    const snapshot = createSnapshot();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, reminders };
        }
        return t;
      }),
    );

    try {
      await updateTaskRemindersMutation.mutateAsync({
        taskId,
        reminders: Tasks.serializeTaskReminders(reminders),
        type: "space",
      });

      return true;
    } catch (e) {
      console.error("Failed to update task reminders", e);
      showErrorToast("Error", "Failed to update task reminders");
      restoreSnapshot(snapshot);
      return false;
    }
  };

  const updateTaskAssignee = async (taskId: string, assignees: TaskBoard.Person[]) => {
    const snapshot = createSnapshot();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, assignees };
        }
        return t;
      }),
    );

    try {
      await updateTaskAssigneeMutation.mutateAsync({
        taskId,
        assigneeIds: assignees.map((assignee) => assignee.id),
        type: "space",
      });

      return true;
    } catch (e) {
      console.error("Failed to update task assignee", e);
      showErrorToast("Error", "Failed to update task assignee");
      restoreSnapshot(snapshot);
      return false;
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
      const response = await updateTaskStatusMutation.mutateAsync({ taskId, status: backendStatus, type: "space" });

      const updatedTask = Tasks.parseTaskForTurboUi(paths, response.task, { type: "space", space });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: updatedTask.status, closedAt: updatedTask.closedAt } : t)),
      );

      return true;
    } catch (e) {
      console.error("Failed to update task status", e);
      showErrorToast("Error", "Failed to update task status");
      restoreSnapshot(snapshot);
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    const snapshot = createSnapshot();

    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await deleteTaskMutation.mutateAsync({ taskId, type: "space" });
    } catch (e) {
      console.error("Failed to delete task", e);
      showErrorToast("Error", "Failed to delete task");
      restoreSnapshot(snapshot);
    }
  };

  const updateTaskDescription = async (taskId: string, description: any) => {
    const snapshot = createSnapshot();

    try {
      const serializedDescription = serializeTaskDescription(description);

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, description: serializedDescription };
          }
          return t;
        }),
      );

      await updateTaskDescriptionMutation.mutateAsync({ taskId, description: serializedDescription, type: "space" });

      return true;
    } catch (e) {
      console.error("Failed to update task description", e);
      showErrorToast("Error", "Failed to update task description");
      restoreSnapshot(snapshot);
      return false;
    }
  };

  return {
    tasks,
    setTasks,
    createTask,
    updateTaskName,
    updateTaskDueDate,
    updateTaskReminders,
    updateTaskAssignee,
    updateTaskStatus,
    deleteTask,
    updateTaskDescription,
  };
}
