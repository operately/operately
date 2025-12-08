import * as React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import { useMilestoneKanbanState } from "@/models/tasks/useMilestoneKanbanState";

import { MilestoneKanbanPage } from "turboui";
import { usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import { assertPresent } from "@/utils/assertions";
import { PageModule } from "@/routes/types";
import { useMilestoneTaskStatuses } from "./useMilestoneTaskStatuses";

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
  } = Tasks.useTasksForTurboUi({
    backendTasks,
    projectId: milestone.project.id,
    cacheKey: pageCacheKey(milestone.id),
    milestones: [],
    refresh,
  });

  const { tasks, statuses, handleStatusesChange } = useMilestoneTaskStatuses(milestone, baseTasks, refresh);

  const { kanbanState, handleTaskKanbanChange } = useMilestoneKanbanState({
    initialRawState: milestone.tasksKanbanState,
    statuses,
    milestoneId: milestone.id,
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
    projectId: milestone.project.id,
    transformResult: transformPerson,
  });

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
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onTaskStatusChange: updateTaskStatus,
    canManageStatuses: milestone.permissions.canEditStatuses,
    onStatusesChange: handleStatusesChange,
    onTaskKanbanChange: handleTaskKanbanChange,
  };

  return <MilestoneKanbanPage key={milestone.id!} {...props} />;
}
