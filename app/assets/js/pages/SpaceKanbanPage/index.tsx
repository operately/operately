import * as React from "react";

import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";
import * as Projects from "@/models/projects";

import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useMe } from "@/contexts/CurrentCompanyContext";

import { SpaceKanbanPage } from "turboui";
import { useSpaceTaskStatuses } from "./useSpaceTaskStatuses";
import { loader, useLoadedData, useRefresh } from "./loader";

export default { name: "SpaceKanbanPage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const { space, tasks: backendTasks } = useLoadedData();
  const refreshPageData = useRefresh();
  const currentUser = useMe();
  const { mutateAsync: updateKanban } = Spaces.useUpdateSpaceKanban();

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
    updateTaskReminders,
    updateTaskAssignee,
    deleteTask,
    updateTaskDescription,
  } = Tasks.useSpaceTasksForTurboUi({
    backendTasks,
    space,
  });

  const richEditorHandlers = useRichEditorHandlers({ scope: { type: "space", id: space.id } });

  const { kanbanState, handleTaskKanbanChange, handleTaskStatusChange } = Tasks.useKanbanState({
    initialRawState: space.tasksKanbanState,
    statuses,
    spaceId: space.id,
    type: "space",
    tasks,
    setTasks,
    updateKanban,
  });

  const { handleStatusesChange } = useSpaceTaskStatuses({
    spaceId: space.id,
    tasks,
    setTasks,
  });

  const projectSearch = Projects.useProjectSearch({ accessLevel: "edit_access", activeOnly: true });
  const spaceSearch = Spaces.useSpaceSearch({
    accessLevel: "edit_access",
    ignoreIds: [space.id],
    withTasksEnabledOnly: true,
  });

  const handleMoveTaskSuccess = React.useCallback(async () => {
    await refreshPageData();
  }, [refreshPageData]);

  const slideInModel = Tasks.useTaskSlideInProps({
    backendTasks,
    paths,
    currentUser,
    tasks,
    commentEntityType: "space_task",
    onRefresh: refreshPageData,
    canEdit: Boolean(space.permissions?.canEdit),
    canComment: Boolean(space.permissions?.canComment),
    variant: "space-task",
    onTaskNameChange: updateTaskName,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onTaskRemindersChange: updateTaskReminders,
    onTaskStatusChange: handleTaskStatusChange,
    onTaskDescriptionChange: updateTaskDescription,
    onMoveTaskSuccess: handleMoveTaskSuccess,
    projectSearch,
    spaceSearch,
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
    canEdit: !!space.permissions?.canEdit,
    assigneePersonSearch: assigneeSearch,

    onTaskKanbanChange: handleTaskKanbanChange,
    onTaskCreate: createTask,
    onTaskNameChange: slideInModel.onTaskNameChange,
    onTaskAssigneeChange: slideInModel.onTaskAssigneeChange,
    onTaskDueDateChange: slideInModel.onTaskDueDateChange,
    onTaskRemindersChange: slideInModel.onTaskRemindersChange,
    onTaskStatusChange: slideInModel.onTaskStatusChange,
    onTaskDelete: deleteTask,
    onTaskDescriptionChange: slideInModel.onTaskDescriptionChange,
    richTextHandlers: richEditorHandlers,

    getTaskPageProps: slideInModel.getTaskPageProps,

    onStatusesChange: handleStatusesChange,
  };

  return <SpaceKanbanPage key={space.id} {...props} />;
}
