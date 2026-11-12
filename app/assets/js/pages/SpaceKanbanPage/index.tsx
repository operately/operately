import * as React from "react";

import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";
import * as Projects from "@/models/projects";

import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { useRichTextHandlers } from "@/hooks/useRichTextHandlers";
import { useMe } from "@/contexts/CurrentCompanyContext";

import { SpaceKanbanPage } from "turboui";
import { useSpaceTaskStatuses } from "./useSpaceTaskStatuses";
import { loader, useLoadedData, useRefresh } from "./loader";

export default { name: "SpaceKanbanPage", loader, Page } as PageModule;

function Page() {
  const data = useLoadedData();
  return <BoardPage key={data.board.id} {...data} />;
}

function BoardPage({ space, board, tasks: backendTasks }: ReturnType<typeof useLoadedData>) {
  const paths = usePaths();
  const refreshPageData = useRefresh();
  const currentUser = useMe();
  const { mutateAsync: updateKanban } = Spaces.useUpdateSpaceKanban();

  const transformPerson = React.useCallback((p: People.Person) => People.parsePersonForTurboUi(paths, p)!, [paths]);
  const assigneeSearch = Tasks.useTaskAssigneeSearch({
    id: space.id,
    type: "space",
    transformResult: transformPerson,
  });

  const statuses = React.useMemo(() => Tasks.parseTaskStatusesForTurboUi(board.taskStatuses), [board.taskStatuses]);

  const {
    tasks,
    setTasks,
    createTask,
    updateTaskName,
    updateTaskDueDate,
    updateTaskReminders,
    updateTaskAssignee,
    deleteTask,
    updateTaskArchive,
    updateTaskDescription,
  } = Tasks.useSpaceTasksForTurboUi({
    backendTasks,
    space,
    boardId: board.id,
  });

  const richTextHandlers = useRichTextHandlers({ taskList: null, scope: { type: "space", id: space.id } });

  const { kanbanState, handleTaskKanbanChange, handleTaskStatusChange } = Tasks.useKanbanState({
    initialRawState: board.tasksKanbanState,
    statuses,
    spaceId: space.id,
    boardId: board.id,
    type: "space",
    tasks,
    setTasks,
    updateKanban,
  });

  const { handleStatusesChange } = useSpaceTaskStatuses({
    spaceId: space.id,
    boardId: board.id,
    tasks,
    setTasks,
  });

  const projectSearch = Projects.useProjectSearch({ accessLevel: "edit_access", activeOnly: true });
  const spaceSearch = Spaces.useSpaceSearch({
    accessLevel: "edit_access",
    withTasksEnabledOnly: true,
  });

  const slideInModel = Tasks.useTaskSlideInProps({
    backendTasks,
    paths,
    currentUser,
    tasks,
    commentEntityType: "space_task",
    onRefresh: refreshPageData,
    canEdit: Boolean(space.permissions?.canEdit),
    canComment: Boolean(space.permissions?.canComment),
    boardArchived: Boolean(board.archivedAt),
    variant: "space-task",
    onTaskNameChange: updateTaskName,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onTaskRemindersChange: updateTaskReminders,
    onTaskStatusChange: handleTaskStatusChange,
    onTaskDescriptionChange: updateTaskDescription,
    projectSearch,
    spaceSearch,
  });

  const props: SpaceKanbanPage.Props = {
    board,
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
    onTaskArchiveChange: updateTaskArchive,
    onTaskDescriptionChange: slideInModel.onTaskDescriptionChange,
    richTextHandlers,

    getTaskPageProps: slideInModel.getTaskPageProps,

    onStatusesChange: handleStatusesChange,
  };

  return <SpaceKanbanPage {...props} />;
}
