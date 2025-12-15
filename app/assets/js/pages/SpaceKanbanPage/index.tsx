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
import { useMe } from "@/contexts/CurrentCompanyContext";

import { SpaceKanbanPage } from "turboui";

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
  const currentUser = useMe();

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

  const slideInModel = Tasks.useTaskSlideInProps({
    backendTasks,
    paths,
    currentUser,
    tasks,
    canEdit: Boolean(space.permissions?.canEdit),
    hideMilestone: true,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onTaskStatusChange: updateTaskStatus,
    onTaskDescriptionChange: updateTaskDescription,
  });

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
    onTaskAssigneeChange: slideInModel.onTaskAssigneeChange,
    onTaskDueDateChange: slideInModel.onTaskDueDateChange,
    onTaskStatusChange: slideInModel.onTaskStatusChange,
    onTaskDelete: deleteTask,
    onTaskDescriptionChange: slideInModel.onTaskDescriptionChange,
    richTextHandlers: richEditorHandlers,

    getTaskPageProps: slideInModel.getTaskPageProps,

    onStatusesChange: handleStatusesChange,
  };

  return <SpaceKanbanPage key={space.id} {...props} />;
}
