import * as React from "react";

import Api from "@/api";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";

import { PageCache } from "@/routes/PageCache";
import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { fetchAll } from "@/utils/async";
import { assertPresent } from "@/utils/assertions";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

import { SpaceKanbanPage, TaskPage } from "turboui";

export default { name: "SpaceKanbanPage", loader, Page } as PageModule;

type LoaderResult = {
  data: {
    space: Spaces.Space;
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
        space: Api.getSpace({ id: params.id, includePermissions: true }).then((d) => d.space!),
        tasks: Api.spaces.listTasks({ spaceId: params.id }).then((d) => d.tasks),
      }),
  });
}

function pageCacheKey(id: string): string {
  return `v1-SpaceKanbanPage-${id}`;
}

function Page() {
  const paths = usePaths();
  const pageData = PageCache.useData(loader);
  const { data } = pageData;
  const { space, tasks: backendTasks } = data;

  assertPresent(space, "Space must be present");

  const transformPerson = React.useCallback((p: People.Person) => People.parsePersonForTurboUi(paths, p)!, [paths]);
  const assigneeSearch = Tasks.useTaskAssigneeSearch({
    id: space.id,
    type: "space",
    transformResult: transformPerson,
  });

  const statuses = React.useMemo(
    () => Tasks.parseTaskStatusesForTurboUi(space.taskStatuses ?? []),
    [space.taskStatuses],
  );

  const {
    tasks,
    setTasks,
    createTask,
    updateTaskName,
    updateTaskDueDate,
    updateTaskAssignee,
    updateTaskStatus,
    deleteTask,
    updateTaskDescription,
  } = Tasks.useSpaceTasksForTurboUi({
    backendTasks,
    spaceId: space.id,
    cacheKey: pageCacheKey(space.id),
    refresh: pageData.refresh,
  });

  const richEditorHandlers = useRichEditorHandlers({ scope: { type: "space", id: space.id } });

  const { kanbanState, handleTaskKanbanChange } = Tasks.useKanbanState({
    initialRawState: space.tasksKanbanState,
    statuses,
    spaceId: space.id,
    type: "space",
    tasks,
    setTasks,
    onSuccess: async () => {
      PageCache.invalidate(pageCacheKey(space.id));
      if (pageData.refresh) {
        await pageData.refresh();
      }
    },
  });

  const handleStatusesChange = React.useCallback(
    async (newStatuses: SpaceKanbanPage.StatusOption[]) => {
      const serialized = Tasks.serializeTaskStatuses(newStatuses);
      await Api.spaces.updateTaskStatuses({ spaceId: space.id, taskStatuses: serialized });
      PageCache.invalidate(pageCacheKey(space.id));
      if (pageData.refresh) {
        await pageData.refresh();
      }
    },
    [space.id, pageData],
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
        projectName: "",
        projectLink: "#",
        workmapLink: paths.spaceWorkMapPath(space.id, "projects" as const),
        projectStatus: "",
        childrenCount: { tasksCount: 0, discussionsCount: 0, checkInsCount: 0 },
        space: {
          id: space.id,
          name: space.name ?? "",
          link: paths.spacePath(space.id),
        },

        milestone: null,
        onMilestoneChange: () => {},
        milestones: [],
        onMilestoneSearch: async () => {},

        name: task.title,
        onNameChange: async (newName) => {
          const res = await updateTaskName(taskId, newName);
          return Boolean(res?.success);
        },

        description,
        onDescriptionChange: async (newDescription) => {
          return await updateTaskDescription(taskId, newDescription);
        },

        status: task.status,
        onStatusChange: (newStatus) => {
          updateTaskStatus(taskId, newStatus);
        },

        statusOptions: statuses,
        dueDate: task.dueDate || undefined,
        onDueDateChange: (newDate) => {
          updateTaskDueDate(taskId, newDate);
        },

        assignee,
        onAssigneeChange: (newAssignee) => {
          updateTaskAssignee(taskId, newAssignee ? { id: newAssignee.id, fullName: newAssignee.fullName, avatarUrl: newAssignee.avatarUrl } : null);
        },

        createdAt: new Date(backendTask?.insertedAt ?? Date.now()),
        createdBy,
        closedAt: null,
        subscriptions: { isSubscribed: false, onToggle: () => {}, hidden: true, entityType: "project_task" },

        onDelete: async () => {
          await deleteTask(taskId);
        },

        assigneePersonSearch: assigneeSearch,
        richTextHandlers: richEditorHandlers,

        canEdit: Boolean(space.permissions?.canEdit),
        updateProjectName: async () => true,

        onAddComment: () => {},
        onEditComment: () => {},
        onDeleteComment: () => {},
      };
    },
    [
      assigneeSearch,
      backendTasks,
      deleteTask,
      paths,
      richEditorHandlers,
      space.id,
      space.name,
      space.permissions?.canEdit,
      statuses,
      tasks,
      updateTaskAssignee,
      updateTaskDescription,
      updateTaskDueDate,
      updateTaskName,
      updateTaskStatus,
    ],
  );

  const props: SpaceKanbanPage.Props = {
    space: {
      id: space.id,
      name: space.name ?? "",
      link: paths.spacePath(space.id),
    },
    navigation: [{ to: paths.spacePath(space.id), label: space.name ?? "" }],
    tasks,
    statuses,
    kanbanState,
    canManageStatuses: !!space.permissions?.canEditStatuses,
    assigneePersonSearch: assigneeSearch,

    onTaskKanbanChange: handleTaskKanbanChange,
    onTaskCreate: createTask,
    onTaskNameChange: updateTaskName,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onTaskStatusChange: updateTaskStatus,
    onTaskDelete: deleteTask,
    onTaskDescriptionChange: updateTaskDescription,
    richTextHandlers: richEditorHandlers,

    getTaskPageProps,

    onStatusesChange: handleStatusesChange,
  };

  return <SpaceKanbanPage key={space.id} {...props} />;
}
