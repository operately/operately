import * as React from "react";

import Api from "@/api";
import * as Milestones from "../milestones";
import * as Tasks from "./index";

import { compareIds, usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { serializeContextualDate } from "../contextualDates";

import { DateField, showErrorToast, TaskBoard } from "turboui";
import { buildMilestonesOrderingState } from "./milestoneOrdering";

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
}

export function useTasksForTurboUi({ backendTasks, projectId, cacheKey, milestones, setMilestones }: Attrs) {
  const paths = usePaths();
  const [tasks, setTasks] = React.useState(Tasks.parseTasksForTurboUi(paths, backendTasks));

  React.useEffect(() => {
    setTasks(Tasks.parseTasksForTurboUi(paths, backendTasks));
  }, [backendTasks, paths]);

  const createSnapshot = React.useCallback((): TasksSnapshot => ({
    tasks: [...tasks],
    milestones: setMilestones ? [...milestones] : undefined,
  }), [tasks, milestones, setMilestones]);

  const restoreSnapshot = React.useCallback((snapshot: TasksSnapshot) => {
    setTasks(snapshot.tasks);
    if (setMilestones && snapshot.milestones) {
      setMilestones(snapshot.milestones);
    }
  }, [setMilestones]);

  const updateMilestonesFromServer = React.useCallback((
    updatedMilestone: Milestones.Milestone | null,
    updatedMilestones: Milestones.Milestone[] | null
  ) => {
    if (!setMilestones) return;

    setMilestones(prev => {
      let newMilestones = [...prev];

      // Handle single milestone update
      if (updatedMilestone) {
        const index = newMilestones.findIndex(m => compareIds(m.id, updatedMilestone.id));
        if (index >= 0) {
          newMilestones[index] = Milestones.parseMilestoneForTurboUi(paths, updatedMilestone);
        }
      }

      // Handle multiple milestones update (takes precedence)
      if (updatedMilestones && updatedMilestones.length > 0) {
        const parsedMilestones = Milestones.parseMilestonesForTurboUi(paths, updatedMilestones); 

        parsedMilestones.forEach(updatedMilestone => {
          const index = newMilestones.findIndex(m => compareIds(m.id, updatedMilestone.id));
          if (index >= 0) {
            newMilestones[index] = updatedMilestone;
          }
        });
      }

      return newMilestones;
    });
  }, [setMilestones]);

  const createTask = async (task: TaskBoard.NewTaskPayload) => {
    const snapshot = createSnapshot();
    const tempId = `temp-${Date.now()}`;

    const optimisticTask: TaskBoard.Task = {
      id: tempId,
      title: task.title,
      description: "",
      link: "#",
      status: "pending" as TaskBoard.Status,
      assignees: task.assignee ? [{ id: task.assignee, fullName: "Loading...", avatarUrl: "" }] : [],
      dueDate: task.dueDate || null,
      milestone: task.milestone,
    };

    setTasks(prev => [...prev, optimisticTask]);

    // Update milestone ordering if task has a milestone
    if (task.milestone && setMilestones) {
      setMilestones(prev => prev.map(m => {
        if (compareIds(m.id, task.milestone!.id)) {
          return {
            ...m,
            tasksOrderingState: m.tasksOrderingState ? [...m.tasksOrderingState, tempId] : [tempId]
          };
        }
        return m;
      }));
    }

    try {
      const res = await Api.project_tasks.create({
        name: task.title,
        assigneeId: task.assignee,
        dueDate: serializeContextualDate(task.dueDate),
        milestoneId: task.milestone?.id || null,
        projectId: projectId,
      });

      // Replace temporary task with real task
      const realTask = Tasks.parseTaskForTurboUi(paths, res.task);
      setTasks(prev => prev.map(t => t.id === tempId ? realTask : t));

      // Update milestones with server response
      updateMilestonesFromServer(res.updatedMilestone, null);

      // Replace temp ID in milestone ordering
      if (task.milestone && setMilestones) {
        setMilestones(prev => prev.map(m => {
          if (compareIds(m.id, task.milestone!.id)) {
            return {
              ...m,
              tasksOrderingState: m.tasksOrderingState ? m.tasksOrderingState.map(id => id === tempId ? realTask.id : id) : [],
            };
          }
          return m;
        }));
      }

      PageCache.invalidate(cacheKey);
      return { success: true };

    } catch (e) {
      console.error("Failed to create task", e);
      showErrorToast("Error", "Failed to create task");
      restoreSnapshot(snapshot);
      return { success: false };
    }
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

  const updateTaskMilestone = async (taskId: string, milestoneId: string, indexInMilestone: number) => {
    try {
      const normalizedMilestoneId = milestoneId === "no-milestone" ? null : milestoneId;
      const taskToMove = tasks.find((t) => t.id === taskId);

      if (!taskToMove) {
        console.error("Task not found", taskId);
        showErrorToast("Error", "Failed to update task milestone");
        return { success: false };
      }

      const milestonesOrderingState = buildMilestonesOrderingState(
        milestones,
        taskToMove,
        normalizedMilestoneId,
        indexInMilestone,
      );

      // Optimistically update tasks
      setTasks((prev) => {
        const foundMilestone = milestones.find((m) => compareIds(m.id, normalizedMilestoneId)) || null;

        return prev.map((t) => {
          if (compareIds(t.id, taskId)) {
            return { ...t, milestone: foundMilestone as any };
          }
          return t;
        });
      });

      // Optimistically update milestones ordering states
      if (setMilestones && milestonesOrderingState.length > 0) {
        setMilestones((prevMilestones) => {
          return prevMilestones.map((milestone) => {
            const orderingUpdate = milestonesOrderingState.find((update) =>
              compareIds(update.milestoneId, milestone.id),
            );

            if (orderingUpdate) {
              return {
                ...milestone,
                tasksOrderingState: orderingUpdate.orderingState,
              };
            }
            return milestone;
          });
        });
      }

      await Api.project_tasks.updateMilestone({
        taskId,
        milestoneId: normalizedMilestoneId,
        milestonesOrderingState,
      });

      PageCache.invalidate(cacheKey);

      return { success: true };
    } catch (e) {
      console.error("Failed to update task milestone", e);
      showErrorToast("Error", "Failed to update task milestone");

      return { success: false };
    }
  };

  return { tasks, createTask, updateTaskDueDate, updateTaskAssignee, updateTaskStatus, updateTaskMilestone };
}
