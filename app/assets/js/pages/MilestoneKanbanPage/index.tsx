import * as React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import { useMilestoneKanbanState } from "@/models/tasks/useMilestoneKanbanState";

import { MilestoneKanbanPage as UiMilestoneKanbanPage } from "turboui";
import { usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import { assertPresent } from "@/utils/assertions";
import { PageModule } from "@/routes/types";

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
  const statusOptions = React.useMemo(
    () => Tasks.parseTaskStatusesForTurboUi(milestone.availableStatuses),
    [milestone.availableStatuses],
  );

  const { tasks, createTask, updateTaskAssignee, updateTaskDueDate } = Tasks.useTasksForTurboUi({
    backendTasks,
    projectId: milestone.project.id,
    cacheKey: pageCacheKey(milestone.id),
    milestones: [],
    refresh,
  });

  const transformPerson = React.useCallback((p) => People.parsePersonForTurboUi(paths, p)!, [paths]);

  const assigneeSearch = Tasks.useTaskAssigneeSearch({
    projectId: milestone.project.id,
    transformResult: transformPerson,
  });

  const { kanbanState, handleTaskKanbanChange } = useMilestoneKanbanState({
    initialRawState: milestone.tasksKanbanState,
    statuses: statusOptions,
    milestoneId: milestone.id,
    tasks,
    onSuccess: async () => {
      PageCache.invalidate(pageCacheKey(milestone.id));

      if (refresh) {
        await refresh();
      }
    },
  });

  const props: UiMilestoneKanbanPage.Props = {
    projectName: milestone.project.name ?? "",

    milestone: Milestones.parseMilestoneForTurboUi(paths, milestone),
    tasks,
    statuses: statusOptions,
    kanbanState,

    assigneePersonSearch: assigneeSearch,
    onTaskCreate: createTask,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onMilestoneUpdate: undefined,
    onTaskKanbanChange: handleTaskKanbanChange,
  };

  return <UiMilestoneKanbanPage key={milestone.id!} {...props} />;
}

