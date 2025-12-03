import * as React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import * as Projects from "@/models/projects";
import * as People from "@/models/people";

import { MilestoneKanbanPage as UiMilestoneKanbanPage, showErrorToast } from "turboui";
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
    childrenCount: Projects.ProjectChildrenCount;
  };
  cacheVersion: number;
};

type MilestoneKanbanState = Record<string, string[]>;

interface TaskKanbanChangeEvent {
  milestoneId: string | null;
  taskId: string;
  from: { status: string; index: number };
  to: { status: string; index: number };
  updatedKanbanState: MilestoneKanbanState;
}

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
        childrenCount: Api.projects
          .countChildren({ id: params.id, useMilestoneId: true })
          .then((d) => d.childrenCount),
      }),
  });
}

function pageCacheKey(id: string): string {
  return `v1-MilestoneKanbanPage-${id}`;
}

function parseKanbanState(
  raw: string | null | undefined,
  statuses: ReturnType<typeof Tasks.parseTaskStatusesForTurboUi>,
): MilestoneKanbanState {
  let parsed: any = {};

  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse tasksKanbanState", e);
      parsed = {};
    }
  }

  const state: MilestoneKanbanState = {};

  statuses.forEach((status) => {
    const key = status.value;
    const list = parsed?.[key];
    state[key] = Array.isArray(list) ? list : [];
  });

  return state;
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

  const kanbanState = React.useMemo(() => parseKanbanState(milestone.tasksKanbanState as any, statusOptions), [
    milestone.tasksKanbanState,
    statusOptions,
  ]);

  const handleTaskKanbanChange = React.useCallback(
    async (event: TaskKanbanChangeEvent) => {
      const statusOption = statusOptions.find((s) => s.value === event.to.status) ?? null;
      const backendStatus = Tasks.serializeTaskStatus(statusOption);

      if (!backendStatus) {
        console.error("Unknown Kanban status", event.to.status);
        showErrorToast("Error", "Failed to update task status");
        return;
      }

      try {
        await Api.project_tasks.updateKanban({
          taskId: event.taskId,
          milestoneId: milestone.id,
          status: backendStatus,
          milestoneKanbanState: JSON.stringify(event.updatedKanbanState),
        });

        PageCache.invalidate(pageCacheKey(milestone.id));

        if (refresh) {
          await refresh();
        }
      } catch (e) {
        console.error("Failed to update Kanban state", e);
        showErrorToast("Error", "Failed to update task position");
      }
    },
    [milestone.id, statusOptions, refresh],
  );

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

