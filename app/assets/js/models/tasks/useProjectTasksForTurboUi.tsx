import * as React from "react";

import Api, { type TaskStatus, type TasksCreateInput } from "@/api";
import * as Milestones from "../milestones";
import * as Tasks from "./index";

import { compareIds, usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { serializeContextualDate } from "../contextualDates";
import * as Signals from "@/signals";

import { DateField, showErrorToast, TaskBoard, TaskPage } from "turboui";
import { serializeTaskDescription } from "./descriptionSerialization";
import { applyTaskMove } from "./listOrdering";
import { isTaskVisible, normalizeMilestonesOrderingState } from "./milestoneOrdering";

interface TasksSnapshot {
  tasks: TaskBoard.Task[];
  milestones?: TaskBoard.Milestone[];
}

interface Attrs {
  backendTasks: Tasks.Task[];
  projectId: string;
  cacheKey: string;
  milestones: TaskBoard.Milestone[];
  setMilestones?: React.Dispatch<React.SetStateAction<TaskBoard.Milestone[]>>;
  refresh?: () => Promise<void>;
  invalidateCache?: () => void;
  invalidateTaskDetails?: () => void;
  refreshTasks?: () => Promise<void>;
}

export function useProjectTasksForTurboUi({
  backendTasks,
  projectId,
  cacheKey,
  milestones,
  setMilestones,
  refresh,
  invalidateCache,
  invalidateTaskDetails,
  refreshTasks,
}: Attrs) {
  const paths = usePaths();
  const [tasks, setTasks] = React.useState(parseBackendTasks(paths, backendTasks));

  React.useEffect(() => {
    setTasks(parseBackendTasks(paths, backendTasks));
  }, [backendTasks, paths]);

  React.useEffect(() => {
    if (!setMilestones) return;

    const normalized = normalizeMilestonesOrderingState(milestones, tasks);
    if (normalized !== milestones) {
      setMilestones(normalized);
    }
  }, [milestones, setMilestones, tasks]);

  const createSnapshot = React.useCallback(
    (): TasksSnapshot => ({
      tasks: [...tasks],
      milestones: setMilestones ? [...milestones] : undefined,
    }),
    [tasks, milestones, setMilestones],
  );

  const restoreSnapshot = React.useCallback(
    (snapshot: TasksSnapshot) => {
      setTasks(snapshot.tasks);
      if (setMilestones && snapshot.milestones) {
        setMilestones(snapshot.milestones);
      }
    },
    [setMilestones],
  );

  const updateMilestonesFromServer = React.useCallback(
    (updatedMilestone: Milestones.Milestone | null, updatedMilestones: Milestones.Milestone[] | null) => {
      if (!setMilestones) return;

      setMilestones((prev) => {
        let newMilestones = [...prev];

        // Handle single milestone update
        if (updatedMilestone) {
          const index = newMilestones.findIndex((m) => compareIds(m.id, updatedMilestone.id));
          if (index >= 0) {
            newMilestones[index] = Milestones.parseMilestoneForTurboUi(paths, updatedMilestone);
          }
        }

        // Handle multiple milestones update (takes precedence)
        if (updatedMilestones && updatedMilestones.length > 0) {
          const parsedMilestones = Milestones.parseMilestonesForTurboUi(paths, updatedMilestones).orderedMilestones;

          parsedMilestones.forEach((updatedMilestone) => {
            const index = newMilestones.findIndex((m) => compareIds(m.id, updatedMilestone.id));
            if (index >= 0) {
              newMilestones[index] = updatedMilestone;
            }
          });
        }

        return newMilestones;
      });
    },
    [setMilestones],
  );

  const invalidateAndRefresh = React.useCallback(async () => {
    if (invalidateCache) {
      invalidateCache();
    } else {
      PageCache.invalidate(cacheKey);
    }
    invalidateTaskDetails?.();

    if (refresh) {
      await refresh();
    }

    if (refreshTasks) {
      await refreshTasks();
    }
  }, [cacheKey, invalidateCache, invalidateTaskDetails, refresh, refreshTasks]);

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
      milestone: task.milestone,
      type: "project",
    };

    setTasks((prev) => [...prev, optimisticTask]);

    // Update milestone ordering if task has a milestone
    if (task.milestone && setMilestones) {
      setMilestones((prev) =>
        prev.map((m) => {
          if (compareIds(m.id, task.milestone!.id)) {
            return {
              ...m,
              tasksOrderingState: m.tasksOrderingState ? [...m.tasksOrderingState, tempId] : [tempId],
            };
          }
          return m;
        }),
      );
    }

    try {
      const backendStatus: TaskStatus | null = Tasks.serializeTaskStatus(task.status ?? null);
      const input = buildProjectTaskCreateInput(task, projectId);

      if (backendStatus !== null) {
        input.status = backendStatus;
      }

      const res = await Api.tasks.create(input);

      // Replace temporary task with real task
      const realTask = Tasks.parseTaskForTurboUi(paths, res.task, { type: "project" });
      setTasks((prev) => prev.map((t) => (t.id === tempId ? realTask : t)));

      updateMilestonesFromServer(res.updatedMilestone ?? null, null);

      // Replace temp ID in milestone ordering
      if (task.milestone && setMilestones) {
        setMilestones((prev) =>
          prev.map((m) => {
            if (compareIds(m.id, task.milestone!.id)) {
              return {
                ...m,
                tasksOrderingState: m.tasksOrderingState
                  ? m.tasksOrderingState.map((id) => (id === tempId ? realTask.id : id))
                  : [],
              };
            }
            return m;
          }),
        );
      }

      await invalidateAndRefresh();

      return { success: true };
    } catch (e) {
      console.error("Failed to create task", e);
      showErrorToast("Error", "Failed to create task");
      restoreSnapshot(snapshot);
      return { success: false };
    }
  };

  const updateTaskDueDate = async (taskId: string, dueDate: DateField.ContextualDate | null) => {
    return Api.tasks
      .updateDueDate({ taskId, dueDate: serializeContextualDate(dueDate), type: "project" })
      .then(() => {
        invalidateAndRefresh();

        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return { ...t, dueDate };
            }
            return t;
          }),
        );

        return true;
      })
      .catch((e) => {
        console.error("Failed to update task due date", e);
        showErrorToast("Error", "Failed to update task due date");

        return false;
      });
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
      await Api.tasks.updateReminders({ taskId, reminders: Tasks.serializeTaskReminders(reminders), type: "project" });
      await invalidateAndRefresh();

      return true;
    } catch (e) {
      console.error("Failed to update task reminders", e);
      showErrorToast("Error", "Failed to update task reminders");
      restoreSnapshot(snapshot);
      return false;
    }
  };

  const updateTaskAssignee = async (taskId: string, assignees: TaskBoard.Person[]) => {
    return Api.tasks
      .updateAssignee({ taskId, assigneeIds: assignees.map((assignee) => assignee.id), type: "project" })
      .then(() => {
        invalidateAndRefresh();

        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return { ...t, assignees };
            }
            return t;
          }),
        );

        return true;
      })
      .catch((e) => {
        console.error("Failed to update task assignee", e);
        showErrorToast("Error", "Failed to update task assignee");

        return false;
      });
  };

  const updateTaskName = React.useCallback(
    async (taskId: string, title: string) => {
      if (title.trim() === "") {
        showErrorToast("Task name cannot be empty", "Failed to update task name.");
        return false;
      }

      const snapshot = createSnapshot();

      setTasks((prev) =>
        prev.map((t) => {
          if (compareIds(t.id, taskId)) {
            return { ...t, title };
          }
          return t;
        }),
      );

      try {
        await Api.tasks.updateName({ taskId, name: title, type: "project" });
        await invalidateAndRefresh();
        return true;
      } catch (e) {
        console.error("Failed to update task name", e);
        showErrorToast("Error", "Failed to update task name.");
        restoreSnapshot(snapshot);
        return false;
      }
    },
    [createSnapshot, invalidateAndRefresh, restoreSnapshot],
  );

  const updateTaskDescription = React.useCallback(
    async (taskId: string, description: any): Promise<boolean> => {
      const snapshot = createSnapshot();
      const serialized = serializeTaskDescription(description);

      setTasks((prev) =>
        prev.map((t) => {
          if (compareIds(t.id, taskId)) {
            return { ...t, description: serialized };
          }
          return t;
        }),
      );

      try {
        await Api.tasks.updateDescription({ taskId, description: serialized, type: "project" });
        await invalidateAndRefresh();
        return true;
      } catch (e) {
        console.error("Failed to update task description", e);
        showErrorToast("Error", "Failed to update task description.");
        restoreSnapshot(snapshot);
        return false;
      }
    },
    [createSnapshot, invalidateAndRefresh, restoreSnapshot],
  );

  const updateTaskStatus = async (taskId: string, status: TaskBoard.Status | null) => {
    const snapshot = createSnapshot();
    const backendStatus: TaskStatus | null = Tasks.serializeTaskStatus(status);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (compareIds(t.id, taskId)) {
          return { ...t, status };
        }
        return t;
      }),
    );

    try {
      const response = await Api.tasks.updateStatus({ taskId, status: backendStatus, type: "project" });

      const updatedTask = Tasks.parseTaskForTurboUi(paths, response.task, { type: "project" });
      setTasks((prev) =>
        prev.map((t) =>
          compareIds(t.id, taskId) ? { ...t, status: updatedTask.status, closedAt: updatedTask.closedAt } : t,
        ),
      );

      updateMilestonesFromServer(response.updatedMilestone ?? null, null);

      await invalidateAndRefresh();

      return true;
    } catch (e) {
      console.error("Failed to update task status", e);
      showErrorToast("Error", "Failed to update task status");
      restoreSnapshot(snapshot);
      return false;
    }
  };

  const updateTaskMilestone = async (taskId: string, milestoneId: string | null, indexInMilestone: number) => {
    const snapshot = createSnapshot();

    try {
      const normalizedMilestoneId = milestoneId === "no-milestone" ? null : milestoneId;
      const taskToMove = tasks.find((t) => compareIds(t.id, taskId));

      if (!taskToMove) {
        console.error("Task not found", taskId);
        showErrorToast("Error", "Something went wrong");
        return false;
      }

      const moved = applyTaskMove(
        {
          tasks: tasks.map((task) => ({ id: task.id, milestoneId: task.milestone?.id ?? null })),
          milestones: milestones.map((milestone) => ({
            id: milestone.id,
            tasksOrderingState: milestone.tasksOrderingState ?? [],
          })),
        },
        taskId,
        normalizedMilestoneId,
        indexInMilestone,
        {
          include: (listed) => {
            const task = tasks.find((item) => compareIds(item.id, listed.id));
            return Boolean(task && isTaskVisible(task));
          },
        },
      );

      setTasks((prev) =>
        prev.map((task) => {
          const next = moved.tasks.find((item) => compareIds(item.id, task.id));
          if (!next) return task;
          if (compareIds(next.milestoneId, task.milestone?.id ?? null)) return task;

          const foundMilestone = milestones.find((milestone) => compareIds(milestone.id, next.milestoneId)) || null;
          return { ...task, milestone: foundMilestone };
        }),
      );

      if (setMilestones) {
        setMilestones((prev) =>
          prev.map((milestone) => {
            const next = moved.milestones.find((item) => compareIds(item.id, milestone.id));
            return next ? { ...milestone, tasksOrderingState: next.tasksOrderingState } : milestone;
          }),
        );
      }

      const res = await Api.tasks.updateMilestoneAndOrdering({
        taskId,
        milestoneId: normalizedMilestoneId,
        index: indexInMilestone,
      });

      updateMilestonesFromServer(null, res.updatedMilestones);

      await invalidateAndRefresh();

      return true;
    } catch (e) {
      console.error("Failed to update task milestone", e);
      showErrorToast("Error", "Failed to update task milestone");
      restoreSnapshot(snapshot);
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    const snapshot = createSnapshot();
    const taskToDelete = tasks.find((t) => compareIds(t.id, taskId));

    if (!taskToDelete) {
      console.error("Task not found", taskId);
      showErrorToast("Error", "Something went wrong");
      return { success: false };
    }

    // Optimistic update - remove task
    setTasks((prev) => prev.filter((t) => !compareIds(t.id, taskId)));

    // Optimistic update - remove from milestone ordering
    if (taskToDelete.milestone && setMilestones) {
      setMilestones((prev) =>
        prev.map((m) => {
          if (compareIds(m.id, taskToDelete.milestone!.id)) {
            return {
              ...m,
              tasksOrderingState: m.tasksOrderingState
                ? m.tasksOrderingState.filter((id) => !compareIds(id, taskId))
                : [],
            };
          }
          return m;
        }),
      );
    }

    try {
      const response = await Api.tasks.delete({ taskId, type: "project" });

      updateMilestonesFromServer(response.updatedMilestone ?? null, null);

      await invalidateAndRefresh();
      Signals.publish(Signals.LocalSignal.RefreshReviewCount);

      return { success: true };
    } catch (e) {
      console.error("Failed to delete task", e);
      showErrorToast("Error", "Failed to delete task");
      restoreSnapshot(snapshot);
      return { success: false };
    }
  };

  return {
    tasks,
    setTasks,
    createTask,
    updateTaskDueDate,
    updateTaskReminders,
    updateTaskAssignee,
    updateTaskName,
    updateTaskDescription,
    updateTaskStatus,
    updateTaskMilestone,
    deleteTask,
  };
}

function parseBackendTasks(paths: ReturnType<typeof usePaths>, tasks: Tasks.Task[]) {
  return Tasks.parseTasksForTurboUi(paths, tasks, { type: "project" });
}

export function buildProjectTaskCreateInput(task: TaskBoard.NewTaskPayload, projectId: string): TasksCreateInput {
  const input: TasksCreateInput = {
    name: task.title,
    assigneeIds: task.assignees.map((assignee) => assignee.id),
    dueDate: serializeContextualDate(task.dueDate),
    milestoneId: task.milestone?.id || null,
    id: projectId,
    type: "project",
  };

  const description = serializeTaskDescription(task.description);
  if (description) {
    input.description = description;
  }

  return input;
}
