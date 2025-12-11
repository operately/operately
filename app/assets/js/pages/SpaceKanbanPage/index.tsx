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

  assertPresent(space, "Space must be present");

  const tasks = React.useMemo(() => Tasks.parseTasksForTurboUi(paths, backendTasks, "space"), [paths, backendTasks]);

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

  const kanbanState = React.useMemo(
    () => Tasks.parseKanbanState(space.tasksKanbanState, statuses as any, tasks as any),
    [statuses, tasks],
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

    // Placeholder callbacks
    onTaskKanbanChange: () => {},
    onTaskCreate: () => {},
    onTaskNameChange: () => {},
    onTaskAssigneeChange: () => {},
    onTaskDueDateChange: () => {},
    onTaskStatusChange: () => {},
    onTaskDelete: () => {},
    onTaskDescriptionChange: async () => false,
    richTextHandlers: undefined,

    onStatusesChange: () => {},
  };

  return <SpaceKanbanPage key={space.id} {...props} />;
}
