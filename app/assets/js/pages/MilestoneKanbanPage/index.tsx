import * as React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import { useMilestoneKanbanState, useTaskSlideIn } from "@/models/tasks";
import { useMe } from "@/contexts/CurrentCompanyContext";

import { MilestoneKanbanPage, showErrorToast } from "turboui";
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
  const currentUser = useMe();
  const pageData = PageCache.useData(loader);
  const { data, refresh } = pageData;
  const { milestone, tasks: backendTasks } = data;

  assertPresent(milestone.project, "Milestone must have a project");
  assertPresent(milestone.space, "Milestone must have a space");
  assertPresent(milestone.permissions, "Milestone must have permissions");

  const { tasks, createTask, updateTaskAssignee, updateTaskDueDate } = Tasks.useTasksForTurboUi({
    backendTasks,
    projectId: milestone.project.id,
    cacheKey: pageCacheKey(milestone.id),
    milestones: [],
    refresh,
  });
  const { statuses, handleStatusesChange } = useMilestoneTaskStatuses(milestone, refresh);

  const transformPerson = React.useCallback((p) => People.parsePersonForTurboUi(paths, p)!, [paths]);

  const assigneeSearch = Tasks.useTaskAssigneeSearch({
    projectId: milestone.project.id,
    transformResult: transformPerson,
  });

  const { kanbanState, handleTaskKanbanChange } = useMilestoneKanbanState({
    initialRawState: milestone.tasksKanbanState,
    statuses,
    milestoneId: milestone.id,
    tasks,
    onSuccess: async () => {
      PageCache.invalidate(pageCacheKey(milestone.id));

      if (refresh) {
        await refresh();
      }
    },
  });

  // Task slide-in state
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const { taskSlideInProps } = useTaskSlideIn({
    taskId: selectedTaskId,
    isOpen: selectedTaskId !== null,
    onClose: () => setSelectedTaskId(null),
    paths,
    currentUser: People.parsePersonForTurboUi(paths, currentUser)!,
  });

  const handleTaskClick = React.useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const props: MilestoneKanbanPage.Props = {
    projectName: milestone.project.name ?? "",

    milestone: Milestones.parseMilestoneForTurboUi(paths, milestone),
    tasks,
    statuses,
    kanbanState,

    assigneePersonSearch: assigneeSearch,
    onTaskCreate: createTask,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onMilestoneUpdate: undefined,
    canManageStatuses: milestone.permissions.canEditStatuses,
    onStatusesChange: handleStatusesChange,
    onTaskKanbanChange: handleTaskKanbanChange,
    onTaskClick: handleTaskClick,

    // Task slide-in
    taskSlideInProps,
  };

  return <MilestoneKanbanPage key={milestone.id!} {...props} />;
}

function useMilestoneTaskStatuses(milestone: Milestones.Milestone, refresh?: () => void) {
  assertPresent(milestone.project, "Milestone must have a project");
  const [statuses, setStatuses] = React.useState(() => Tasks.parseTaskStatusesForTurboUi(milestone.availableStatuses));

  React.useEffect(() => {
    setStatuses(Tasks.parseTaskStatusesForTurboUi(milestone.availableStatuses));
  }, [milestone.availableStatuses]);

  const handleStatusesChange = React.useCallback(
    async (nextStatuses: typeof statuses) => {
      const previousStatuses = statuses;
      setStatuses(nextStatuses);

      try {
        const backendStatuses = Tasks.serializeTaskStatuses(nextStatuses);
        const res = await Api.projects.updateTaskStatuses({
          projectId: milestone.project!.id,
          taskStatuses: backendStatuses,
        });

        if (res.success === false) {
          setStatuses(previousStatuses);
          showErrorToast("Error", "Failed to update task statuses");
          return;
        }

        if (refresh) {
          await refresh();
        }
      } catch (error) {
        console.error("Failed to update task statuses", error);
        setStatuses(previousStatuses);
        showErrorToast("Error", "Failed to update task statuses");
      }
    },
    [milestone.project.id, refresh, statuses],
  );

  return { statuses, handleStatusesChange };
}
