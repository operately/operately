import * as React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";

import { MilestoneKanbanPage, showErrorToast, TaskPage } from "turboui";
import { usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { projectPageCacheKey } from "../ProjectPage";
import { fetchAll } from "@/utils/async";
import { assertPresent } from "@/utils/assertions";
import { PageModule } from "@/routes/types";
import { useMilestoneTaskStatuses } from "./useMilestoneTaskStatuses";
import { useMilestones } from "@/models/milestones/useMilestones";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

export default { name: "MilestoneKanbanPage", loader, Page } as PageModule;

type LoaderResult = {
  data: {
    milestone: Milestones.Milestone;
    tasks: Tasks.Task[];
  };
  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      fetchAll({
        milestone: Milestones.getMilestone({
          id: params.id,
          includeProject: true,
          includeSpace: true,
          includePermissions: true,
          includeAvailableStatuses: true,
          includeSubscriptionList: true,
        }).then((d) => d.milestone),
        tasks: Api.project_milestones.listTasks({ milestoneId: params.id }).then((d) => d.tasks),
      }),
  });
}

function pageCacheKey(id: string): string {
  return `v1-MilestoneKanbanPage-${id}`;
}

function Page() {
  const paths = usePaths();
  const pageData = PageCache.useData(loader);
  const { data, refresh } = pageData;
  const { milestone, tasks: backendTasks } = data;

  assertPresent(milestone.project, "Milestone must have a project");
  assertPresent(milestone.space, "Milestone must have a space");
  assertPresent(milestone.permissions, "Milestone must have permissions");

  const {
    tasks: baseTasks,
    setTasks: setBaseTasks,
    createTask,
    updateTaskAssignee,
    updateTaskDueDate,
    updateTaskStatus,
    updateTaskMilestone,
    deleteTask,
  } = Tasks.useTasksForTurboUi({
    backendTasks,
    projectId: milestone.project.id,
    cacheKey: pageCacheKey(milestone.id),
    milestones: [],
    refresh,
    type: "project",
  });

  const { tasks, statuses, handleStatusesChange } = useMilestoneTaskStatuses(milestone, baseTasks, refresh);

  const { kanbanState, handleTaskKanbanChange } = Tasks.useKanbanState({
    initialRawState: milestone.tasksKanbanState,
    statuses,
    milestoneId: milestone.id,
    type: "milestone",
    tasks,
    setTasks: setBaseTasks,
    onSuccess: async () => {
      PageCache.invalidate(pageCacheKey(milestone.id));

      if (refresh) {
        await refresh();
      }
    },
  });

  const transformPerson = React.useCallback((p) => People.parsePersonForTurboUi(paths, p)!, [paths]);

  const assigneeSearch = Tasks.useTaskAssigneeSearch({
    id: milestone.project.id,
    type: "project",
    transformResult: transformPerson,
  });
  const { milestones, search: searchMilestones } = useMilestones(milestone.project.id);
  const richEditorHandlers = useRichEditorHandlers({ scope: { type: "project", id: milestone.project.id } });

  const handleTaskNameChange = usePageField<string>({
    update: (taskId, v) => Api.tasks.updateName({ taskId, name: v, type: "project" }),
    onError: (e: string) => showErrorToast(e, "Failed to update task name."),
    validations: [(v) => (v.trim() === "" ? "Task name cannot be empty" : null)],
    onOptimisticUpdade: (taskId, v) => {
      setBaseTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, title: v };
          }
          return t;
        }),
      );
    },
  });

  const handleTaskDescriptionChange = usePageField<any>({
    update: (taskId, v) => Api.tasks.updateDescription({ taskId, description: JSON.stringify(v), type: "project" }),
    onError: () => showErrorToast("Error", "Failed to update task description."),
    onOptimisticUpdade: (taskId, v) => {
      setBaseTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, description: v ? JSON.stringify(v) : "" };
          }
          return t;
        }),
      );
    },
  });

  const handleTaskMilestoneChange = React.useCallback(
    (taskId: string, milestone: MilestoneKanbanPage.Milestone | null) => {
      // We can't control index in new milestone, so we default to index 1000. The backend will normalize ordering.
      const indexInMilestone = 1000;
      const milestoneId = milestone?.id ?? "no-milestone";

      return updateTaskMilestone(taskId, milestoneId, indexInMilestone);
    },
    [updateTaskMilestone],
  );

  const handleTaskDelete = React.useCallback(
    async (taskId: string) => {
      const result = await deleteTask(taskId);

      if (!result?.success) return;

      if (milestone.project?.id) {
        PageCache.invalidate(projectPageCacheKey(milestone.project.id));
      }
    },
    [deleteTask, milestone.project?.id],
  );

  const getTaskPageProps = React.useCallback(
    (taskId: string): TaskPage.Props | null => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return null;

      const backendTask = backendTasks.find((t) => t.id === taskId) ?? null;

      const description = (() => {
        if (!task.description) return null;
        try {
          return JSON.parse(task.description);
        } catch {
          return null;
        }
      })();

      const assignee = (() => {
        const first = task.assignees?.[0];
        if (!first) return null;
        return {
          id: first.id,
          fullName: first.fullName,
          avatarUrl: first.avatarUrl,
          profileLink: paths.profilePath(first.id),
        };
      })();

      const createdBy = (() => {
        const creator = backendTask?.creator;
        if (creator) {
          const parsed = People.parsePersonForTurboUi(paths, creator);
          if (parsed) {
            return {
              id: parsed.id,
              fullName: parsed.fullName,
              avatarUrl: parsed.avatarUrl,
              profileLink: parsed.profileLink,
            };
          }
        }

        return {
          id: "unknown",
          fullName: "Unknown",
          avatarUrl: null,
          profileLink: "#",
        };
      })();

      return {
        projectName: milestone.project?.name ?? "",
        projectLink: paths.projectPath(milestone.project!.id),
        workmapLink: paths.spaceWorkMapPath(milestone.space!.id, "projects" as const),
        projectStatus: milestone.project?.status ?? "",
        childrenCount: { tasksCount: 0, discussionsCount: 0, checkInsCount: 0 },
        space: {
          id: milestone.space!.id,
          name: milestone.space!.name ?? "",
          link: paths.spacePath(milestone.space!.id),
        },

        milestone: task.milestone
          ? {
              id: task.milestone.id,
              name: task.milestone.name,
              dueDate: task.milestone.dueDate ?? null,
              status: task.milestone.status,
              link: task.milestone.link,
            }
          : null,
        onMilestoneChange: (m) => {
          const mapped = m
            ? {
                id: m.id,
                name: m.name,
                dueDate: m.dueDate,
                status: m.status,
                link: m.link,
              }
            : null;

          handleTaskMilestoneChange(taskId, mapped);
        },
        milestones,
        onMilestoneSearch: searchMilestones,

        name: task.title,
        onNameChange: (newName) => handleTaskNameChange(taskId, newName),

        description,
        onDescriptionChange: (newDescription) => handleTaskDescriptionChange(taskId, newDescription),

        status: task.status,
        onStatusChange: (newStatus) => updateTaskStatus(taskId, newStatus),

        statusOptions: statuses,
        dueDate: task.dueDate || undefined,
        onDueDateChange: (newDate) => updateTaskDueDate(taskId, newDate),

        assignee,
        onAssigneeChange: (newAssignee) => {
          updateTaskAssignee(taskId, newAssignee ? { id: newAssignee.id, fullName: newAssignee.fullName, avatarUrl: newAssignee.avatarUrl } : null);
        },

        createdAt: new Date(backendTask?.insertedAt ?? Date.now()),
        createdBy,
        closedAt: null,
        subscriptions: { isSubscribed: false, onToggle: () => {}, hidden: true, entityType: "project_task" },

        onDelete: async () => {
          await handleTaskDelete(taskId);
        },

        assigneePersonSearch: assigneeSearch,
        richTextHandlers: richEditorHandlers,

        canEdit: true,
        updateProjectName: async () => true,

        onAddComment: () => {},
        onEditComment: () => {},
        onDeleteComment: () => {},
      };
    },
    [
      assigneeSearch,
      backendTasks,
      handleTaskDelete,
      handleTaskDescriptionChange,
      handleTaskMilestoneChange,
      handleTaskNameChange,
      milestone.project,
      milestone.space,
      milestones,
      paths,
      richEditorHandlers,
      searchMilestones,
      statuses,
      tasks,
      updateTaskAssignee,
      updateTaskDueDate,
      updateTaskStatus,
    ],
  );

  const props: MilestoneKanbanPage.Props = {
    projectName: milestone.project.name ?? "",

    navigation: [
      { to: paths.spacePath(milestone.space.id), label: milestone.space.name },
      { to: paths.spaceWorkMapPath(milestone.space.id, "projects" as const), label: "Projects" },
      { to: paths.projectPath(milestone.project.id), label: milestone.project.name },
    ],

    milestone: Milestones.parseMilestoneForTurboUi(paths, milestone),
    tasks,
    statuses,
    kanbanState,

    assigneePersonSearch: assigneeSearch,
    onTaskCreate: createTask,
    onTaskNameChange: handleTaskNameChange,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onTaskStatusChange: updateTaskStatus,
    onTaskMilestoneChange: handleTaskMilestoneChange,
    onTaskDelete: handleTaskDelete,
    milestones: milestones,
    onMilestoneSearch: searchMilestones,
    onTaskDescriptionChange: handleTaskDescriptionChange,
    richTextHandlers: richEditorHandlers,

    canManageStatuses: milestone.permissions.canEditStatuses,
    onStatusesChange: handleStatusesChange,
    onTaskKanbanChange: handleTaskKanbanChange,

    getTaskPageProps,
  };

  return <MilestoneKanbanPage key={milestone.id!} {...props} />;
}

interface usePageFieldProps<T> {
  update: (taskId: string, newValue: T) => Promise<any>;
  onError: (error: any) => void;
  validations?: ((newValue: T) => string | null)[];
  refreshPageData?: () => Promise<void>;
  onOptimisticUpdade?: (taskId: string, newValue: T) => void;
}

function usePageField<T>({
  update,
  onError,
  validations,
  refreshPageData,
  onOptimisticUpdade,
}: usePageFieldProps<T>): (taskId: string, v: T) => Promise<boolean> {
  const pageData = PageCache.useData(loader);
  const { data } = pageData;

  return React.useCallback(
    async (taskId: string, newVal: T): Promise<boolean> => {
      if (validations) {
        for (const validation of validations) {
          const error = validation(newVal);
          if (error) {
            onError?.(error);
            return false;
          }
        }
      }

      const errorHandler = (error: any) => {
        onError?.(error);
      };

      if (onOptimisticUpdade) {
        onOptimisticUpdade(taskId, newVal);
      }

      try {
        const res = await update(taskId, newVal);

        if (res === false || (typeof res === "object" && (res as any)?.success === false)) {
          errorHandler("Update failed");
          return false;
        }

        PageCache.invalidate(pageCacheKey(data.milestone.id!));

        if (refreshPageData) {
          await refreshPageData();
        }

        return true;
      } catch (err) {
        errorHandler(err);
        return false;
      }
    },
    [update, onError, validations, refreshPageData, onOptimisticUpdade, data.milestone.id],
  );
}
