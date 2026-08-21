import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconPlus } from "../icons";
import { BlackLink } from "../Link";
import { isContentEmpty } from "../RichContent";
import { DescriptionIndicator } from "../TaskBoard/components/DescriptionIndicator";
import { TaskSectionEmptyState } from "../MilestonePage/components/TaskSectionEmptyState";
import {
  TasksBoardView,
  TasksMenu,
  TaskDisplayMenu,
  parseTaskDisplayMode,
  useMilestoneFilter,
  useTaskDisplayMode,
} from "../TaskBoard";
import { TemplateTaskList } from "../TaskBoard/components/TemplateTaskList";
import { InlineTaskCreator } from "../TaskBoard/components/InlineTaskCreator";
import { useInlineTaskCreator } from "../TaskBoard/hooks/useInlineTaskCreator";
import { useTaskSlideInSelection } from "../TaskBoard/hooks/useTaskSlideInSelection";
import { TaskSlideIn } from "../TaskBoard/KanbanView/TaskSlideIn";
import type { KanbanState, TemplateTaskSlideInContext } from "../TaskBoard/KanbanView/types";
import type { Task, TaskDisplayMode } from "../TaskBoard/types";
import { TaskCreationModal } from "../TaskCreationModal";
import { MilestoneFormModal } from "./MilestoneFormModal";
import type { TemplateProjectPage } from ".";
import { useBoardDnD } from "../utils/PragmaticDragAndDrop";
import type { BoardLocation, BoardMove } from "../utils/PragmaticDragAndDrop";
import classNames from "../utils/classnames";
import { compareIds } from "../utils/ids";
import { useStateWithLocalStorage } from "../utils/useStateWithLocalStorage";
import {
  fillKanbanFromTasks,
  statusKeys,
  toBoardMilestone,
  toBoardTask,
  toTemplateTaskCreatePayload,
} from "./kanbanAdapters";

const ROOT_TASKS_CONTAINER_ID = "no-milestone";
const TASK_DISPLAY_STORAGE_NAMESPACE = "templateTaskBoard";
const TASK_DISPLAY_STORAGE_KEY = "taskDisplayMode";

export function TaskBoard({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
  const [tasksView, setTasksView] = useStateWithLocalStorage<TaskDisplayMode>(
    TASK_DISPLAY_STORAGE_NAMESPACE,
    TASK_DISPLAY_STORAGE_KEY,
    "list",
    {
      deserialize: (value) => parseTaskDisplayMode(JSON.parse(value)) ?? "list",
    },
  );
  const [taskDisplayMode, setTaskDisplayMode] = useTaskDisplayMode({
    tasksView,
    canPersistTasksView: true,
    onTasksViewChange: setTasksView,
  });
  const boardMilestones = React.useMemo(() => props.milestones.map(toBoardMilestone), [props.milestones]);
  const allBoardTasks = React.useMemo(
    () => props.tasks.map((task) => toBoardTask(task, props.milestones)),
    [props.milestones, props.tasks],
  );
  const { selectedMilestone, selectedMilestoneId, tasks: boardTasks, onMilestoneFilterChange } = useMilestoneFilter({
    milestones: boardMilestones,
    tasks: allBoardTasks,
  });

  const handleDisplayModeChange = React.useCallback(
    (mode: TaskDisplayMode) => {
      setTaskDisplayMode(mode);
      if (mode === "list") onMilestoneFilterChange(null);
    },
    [onMilestoneFilterChange, setTaskDisplayMode],
  );

  if (taskDisplayMode === "board") {
    return (
      <BoardView
        props={props}
        canEdit={canEdit}
        taskDisplayMode={taskDisplayMode}
        onDisplayModeChange={handleDisplayModeChange}
        boardMilestones={boardMilestones}
        selectedMilestone={selectedMilestone}
        selectedMilestoneId={selectedMilestoneId}
        boardTasks={boardTasks}
        onMilestoneFilterChange={onMilestoneFilterChange}
      />
    );
  }

  return (
    <ListView
      props={props}
      canEdit={canEdit}
      taskDisplayMode={taskDisplayMode}
      onDisplayModeChange={handleDisplayModeChange}
    />
  );
}

function BoardView({
  props,
  canEdit,
  taskDisplayMode,
  onDisplayModeChange,
  boardMilestones,
  selectedMilestone,
  selectedMilestoneId,
  boardTasks,
  onMilestoneFilterChange,
}: {
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  taskDisplayMode: TaskDisplayMode;
  onDisplayModeChange: (mode: TaskDisplayMode) => void;
  boardMilestones: ReturnType<typeof toBoardMilestone>[];
  selectedMilestone: Task["milestone"];
  selectedMilestoneId: string | null;
  boardTasks: Task[];
  onMilestoneFilterChange: (milestoneId: string | null) => void;
}) {
  const keys = React.useMemo(() => statusKeys(props.statuses), [props.statuses]);
  const kanbanState = React.useMemo(
    () => fillKanbanFromTasks(props.template.tasksKanbanState, props.tasks, keys),
    [keys, props.tasks, props.template.tasksKanbanState],
  );

  const slideInContext = useTemplateSlideInContext(props, canEdit);
  const defaultStatus = props.statuses[0];

  const handleStatusChange = React.useCallback(
    (taskId: string, status: TemplateProjectPage.Task["status"] | null) => {
      if (!status) return;
      const statusKey = status.value || status.id;
      const fromStatus =
        keys.find((key) => (kanbanState[key] ?? []).some((id) => compareIds(id, taskId))) ?? keys[0] ?? statusKey;
      const fromIndex = (kanbanState[fromStatus] ?? []).findIndex((id) => compareIds(id, taskId));
      const withoutTask = Object.fromEntries(
        keys.map((key) => [key, (kanbanState[key] ?? []).filter((id) => !compareIds(id, taskId))]),
      ) as KanbanState;
      const destinationIndex = status.closed ? 0 : (withoutTask[statusKey] ?? []).length;
      const column = [...(withoutTask[statusKey] ?? [])];
      column.splice(destinationIndex, 0, taskId);
      const updatedKanbanState = { ...withoutTask, [statusKey]: column };

      void props.onTaskKanbanChange?.({
        milestoneId: selectedMilestoneId,
        taskId,
        from: { status: fromStatus, index: Math.max(fromIndex, 0) },
        to: { status: statusKey, index: destinationIndex },
        updatedKanbanState,
      });
    },
    [kanbanState, keys, props, selectedMilestoneId],
  );

  return (
    <TasksBoardView
      testId="template-task-board"
      displayMode={taskDisplayMode}
      onDisplayModeChange={onDisplayModeChange}
      selectedMilestone={selectedMilestone}
      onMilestoneFilterChange={onMilestoneFilterChange}
      canCreateMilestone={canEdit && Boolean(props.onMilestoneCreate)}
      onCreateMilestone={(milestone) => {
        props.onMilestoneCreate?.({
          title: milestone.name,
          description: null,
          dueOffsetDays: null,
        });
        return { success: true };
      }}
      canManageStatuses={canEdit && Boolean(props.onStatusesChange)}
      tasks={boardTasks}
      statuses={props.statuses}
      kanbanState={kanbanState}
      onTaskKanbanChange={props.onTaskKanbanChange}
      onTaskCreate={
        defaultStatus
          ? (payload) => props.onTaskCreate?.(toTemplateTaskCreatePayload(payload, selectedMilestoneId, defaultStatus))
          : undefined
      }
      onTaskNameChange={(taskId, name) => void props.onTaskUpdate?.(taskId, { name })}
      onTaskAssigneeChange={(taskId, people) =>
        void props.onTaskUpdate?.(taskId, {
          assignees: people.map((person) => ({
            id: person.id,
            person,
            role: "contributor",
            responsibility: null,
            accessLevel: 70,
            active: true,
          })),
        })
      }
      onTaskStatusChange={handleStatusChange}
      onTaskMilestoneChange={(taskId, milestone) =>
        void props.onTaskUpdate?.(taskId, { milestoneId: milestone?.id ?? null })
      }
      onTaskDelete={(taskId) => void props.onTaskDelete?.(taskId)}
      onTaskDescriptionChange={async (taskId, description) => {
        const result = await props.onTaskUpdate?.(taskId, { description });
        return result !== false;
      }}
      milestones={boardMilestones}
      assigneePersonSearch={props.personSearch}
      richTextHandlers={props.richTextHandlers}
      getTaskPageProps={(taskId) =>
        props.getTemplateTaskPageProps ? props.getTemplateTaskPageProps(taskId, slideInContext) : null
      }
      canEdit={canEdit}
      onStatusesChange={props.onStatusesChange}
    />
  );
}

function ListView({
  props,
  canEdit,
  taskDisplayMode,
  onDisplayModeChange,
}: {
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  taskDisplayMode: TaskDisplayMode;
  onDisplayModeChange: (mode: TaskDisplayMode) => void;
}) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [createMilestoneId, setCreateMilestoneId] = React.useState<string | undefined>();
  const [isCreatingMilestone, setIsCreatingMilestone] = React.useState(false);
  const slideInEnabled = Boolean(props.getTemplateTaskPageProps);
  const { selectedTaskId, setSelectedTaskId } = useTaskSlideInSelection({
    tasks: props.tasks,
    enabled: slideInEnabled,
  });
  const isDraggingEnabled = canEdit && Boolean(props.onTaskReorder);
  const handleTaskMove = React.useCallback(
    (move: BoardMove) => {
      if (!isDraggingEnabled) return;

      const milestoneId =
        move.destination.containerId === ROOT_TASKS_CONTAINER_ID ? null : move.destination.containerId;
      props.onTaskReorder?.(move.itemId, milestoneId, move.destination.index);
    },
    [isDraggingEnabled, props.onTaskReorder],
  );
  const tasks = props.tasks;
  const orderedMilestones: Array<TemplateProjectPage.Milestone | null> = [null, ...props.milestones];
  const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(handleTaskMove);
  const activeDraggedItemId = isDraggingEnabled ? draggedItemId : null;
  const activeDestination = isDraggingEnabled ? destination : null;
  const slideInContext = useTemplateSlideInContext(props, canEdit);
  const taskPageProps =
    selectedTaskId && props.getTemplateTaskPageProps
      ? props.getTemplateTaskPageProps(selectedTaskId, slideInContext)
      : null;
  const openCreateModal = (milestoneId?: string) => {
    setCreateMilestoneId(milestoneId);
    setIsCreating(true);
  };
  const closeCreateModal = () => {
    setIsCreating(false);
    setCreateMilestoneId(undefined);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col pb-8" data-test-id="template-task-board">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-surface-base px-4 py-4 sm:items-center sm:py-6 lg:px-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          {canEdit && (
            <>
              <PrimaryButton size="xs" onClick={() => openCreateModal()} testId="add-template-task">
                New task
              </PrimaryButton>
              <SecondaryButton size="xs" onClick={() => setIsCreatingMilestone(true)} testId="add-template-milestone">
                New milestone
              </SecondaryButton>
            </>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 sm:-mb-2">
          {canEdit && (
            <TasksMenu
              canManageStatuses={Boolean(props.onStatusesChange)}
              statuses={props.statuses}
              onSaveCustomStatuses={(payload) => props.onStatusesChange?.(payload)}
            />
          )}
          <TaskDisplayMenu mode={taskDisplayMode} onChange={onDisplayModeChange} />
        </div>
      </div>
      <TaskCreationModal
        variant="project-template"
        isOpen={isCreating}
        onClose={closeCreateModal}
        onCreateTask={(task) => props.onTaskCreate?.(task)}
        milestones={props.milestones}
        currentMilestoneId={createMilestoneId}
        statuses={props.statuses}
        personSearch={props.personSearch}
        richTextHandlers={props.richTextHandlers}
      />
      <MilestoneFormModal
        isOpen={isCreatingMilestone}
        onClose={() => setIsCreatingMilestone(false)}
        onCreate={props.onMilestoneCreate}
      />
      <TaskSlideIn
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        taskPageProps={taskPageProps}
      />
      <div className="overflow-hidden rounded-md border border-surface-outline bg-surface-base">
        {orderedMilestones.map((milestone) => {
          const milestoneTasks = tasks.filter((task) => task.milestoneId === (milestone?.id ?? null));
          const containerId = milestone?.id ?? ROOT_TASKS_CONTAINER_ID;
          const isEmptyRootDropTarget = milestone === null && activeDraggedItemId !== null;
          if (milestoneTasks.length === 0 && milestone === null && !isEmptyRootDropTarget) return null;

          return (
            <TaskSection
              key={milestone?.id ?? "root"}
              title={milestone?.title ?? "No milestone"}
              link={milestone?.link}
              description={milestone?.description}
              tasks={milestoneTasks}
              containerId={containerId}
              milestoneId={milestone?.id ?? null}
              props={props}
              canEdit={canEdit}
              isDraggingEnabled={isDraggingEnabled}
              draggedItemId={activeDraggedItemId}
              destination={activeDestination}
              placeholderHeight={draggedItemDimensions?.height ?? null}
              onTaskOpen={slideInEnabled ? setSelectedTaskId : undefined}
              onRequestAdvancedCreate={() => openCreateModal(milestone?.id)}
            />
          );
        })}
        {tasks.length === 0 && props.milestones.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-content-dimmed">
            Add the first task to define the work.
          </div>
        )}
      </div>
    </div>
  );
}

function useTemplateSlideInContext(props: TemplateProjectPage.Props, canEdit: boolean): TemplateTaskSlideInContext {
  return React.useMemo(
    () => ({
      tasks: props.tasks,
      milestones: props.milestones,
      statuses: props.statuses,
      onTaskCreate: props.onTaskCreate,
      onTaskUpdate: props.onTaskUpdate,
      onTaskDelete: props.onTaskDelete,
      onTaskReorder: props.onTaskReorder,
      personSearch: props.personSearch,
      richTextHandlers: props.richTextHandlers,
      canEdit,
      formattedTimePreferences: props.formattedTimePreferences,
    }),
    [
      canEdit,
      props.formattedTimePreferences,
      props.milestones,
      props.onTaskCreate,
      props.onTaskDelete,
      props.onTaskReorder,
      props.onTaskUpdate,
      props.personSearch,
      props.richTextHandlers,
      props.statuses,
      props.tasks,
    ],
  );
}

function TaskSection({
  title,
  link,
  description,
  tasks,
  containerId,
  milestoneId,
  props,
  canEdit,
  isDraggingEnabled,
  draggedItemId,
  destination,
  placeholderHeight,
  onTaskOpen,
  onRequestAdvancedCreate,
}: {
  title: string;
  link?: string;
  description?: unknown;
  tasks: TemplateProjectPage.Task[];
  containerId: string;
  milestoneId: string | null;
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  isDraggingEnabled: boolean;
  draggedItemId: string | null;
  destination: BoardLocation | null;
  placeholderHeight: number | null;
  onTaskOpen?: (taskId: string | null) => void;
  onRequestAdvancedCreate: () => void;
}) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const defaultStatus = props.statuses[0];
  const { open: creatorOpen, openCreator, closeCreator, creatorRef, hoverBind } = useInlineTaskCreator();
  const handleCreateTask = React.useCallback(
    (name: string) => {
      if (!defaultStatus || !props.onTaskCreate) return;

      props.onTaskCreate({
        name,
        description: null,
        milestoneId,
        priority: null,
        size: null,
        dueOffsetDays: null,
        status: defaultStatus,
        reminders: [],
        assignees: [],
      });
    },
    [defaultStatus, milestoneId, props.onTaskCreate],
  );
  const inlineCreator =
    creatorOpen && canEdit && props.onTaskCreate ? (
      <InlineTaskCreator
        ref={creatorRef}
        onCreate={handleCreateTask}
        onRequestAdvanced={onRequestAdvancedCreate}
        onCancel={closeCreator}
        autoFocus
        testId={`inline-template-task-creator-${containerId}`}
      />
    ) : null;

  useEffect(() => {
    if (!isDraggingEnabled) return;

    const element = sectionRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ containerId, index: tasks.length }),
    });
  }, [containerId, isDraggingEnabled, tasks.length]);

  const isRootDropTarget = milestoneId === null && destination?.containerId === containerId;

  return (
    <section
      ref={sectionRef}
      data-test-id={`template-task-section-${containerId}`}
      data-drop-target={isRootDropTarget ? "true" : undefined}
      className={classNames(
        isRootDropTarget && "bg-surface-highlight/50 ring-2 ring-inset ring-surface-accent/50 transition-colors",
      )}
      {...hoverBind}
    >
      <div
        className={classNames(
          "flex items-center justify-between border-b border-surface-outline px-4 py-3",
          isRootDropTarget ? "bg-surface-highlight/70" : "bg-surface-dimmed",
        )}
        data-test-id={`template-task-section-header-${containerId}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 text-sm font-semibold">
            {link ? (
              <BlackLink
                to={link}
                className="min-w-0 text-sm font-semibold text-content-base transition-colors md:hover:text-link-hover"
                underline="hover"
                title={title}
              >
                {title}
              </BlackLink>
            ) : (
              title
            )}
          </div>
          {milestoneId ? (
            <DescriptionIndicator hasDescription={!isContentEmpty(description)} iconSize={12} />
          ) : null}
        </div>
        {canEdit && props.onTaskCreate ? (
          <SecondaryButton
            size="xs"
            icon={IconPlus}
            onClick={openCreator}
            testId={`template-task-section-add-${containerId}`}
          >
            <span className="sr-only">Add task</span>
          </SecondaryButton>
        ) : null}
      </div>
      <TemplateTaskList
        tasks={tasks}
        destinationMilestoneId={milestoneId}
        canEdit={canEdit}
        onTaskReorder={props.onTaskReorder}
        taskRowProps={props}
        onTaskOpen={onTaskOpen}
        inlineCreateRow={inlineCreator}
        emptyState={<TaskSectionEmptyState inlineCreator={inlineCreator} showCreationPrompt={canEdit} />}
        dragState={{ draggedItemId, destination, placeholderHeight }}
        highlighted={isRootDropTarget}
      />
    </section>
  );
}
