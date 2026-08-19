import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconPlus } from "../icons";
import { BlackLink } from "../Link";
import { isContentEmpty } from "../RichContent";
import { DescriptionIndicator } from "../TaskBoard/components/DescriptionIndicator";
import { TaskSectionEmptyState } from "../MilestonePage/components/TaskSectionEmptyState";
import { TasksMenu } from "../TaskBoard";
import { TemplateTaskList } from "../TaskBoard/components/TemplateTaskList";
import { InlineTaskCreator } from "../TaskBoard/components/InlineTaskCreator";
import { useInlineTaskCreator } from "../TaskBoard/hooks/useInlineTaskCreator";
import { useTaskSlideInSelection } from "../TaskBoard/hooks/useTaskSlideInSelection";
import { TaskSlideIn } from "../TaskBoard/KanbanView/TaskSlideIn";
import type { TemplateTaskSlideInContext } from "../TaskBoard/KanbanView/types";
import { TaskCreationModal } from "../TaskCreationModal";
import { MilestoneFormModal } from "./MilestoneFormModal";
import type { TemplateProjectPage } from ".";
import { useBoardDnD } from "../utils/PragmaticDragAndDrop";
import type { BoardLocation, BoardMove } from "../utils/PragmaticDragAndDrop";

const ROOT_TASKS_CONTAINER_ID = "no-milestone";

export function TaskBoard({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
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
  const slideInContext = React.useMemo<TemplateTaskSlideInContext>(
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
      {canEdit && (
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-surface-base px-4 py-4 sm:items-center sm:py-6 lg:px-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
            <PrimaryButton size="xs" onClick={() => openCreateModal()} testId="add-template-task">
              New task
            </PrimaryButton>
            <SecondaryButton size="xs" onClick={() => setIsCreatingMilestone(true)} testId="add-template-milestone">
              New milestone
            </SecondaryButton>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 sm:-mb-2">
            <TasksMenu
              canManageStatuses={Boolean(props.onStatusesChange)}
              statuses={props.statuses}
              onSaveCustomStatuses={(payload) => props.onStatusesChange?.(payload)}
            />
          </div>
        </div>
      )}
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

  return (
    <section ref={sectionRef} data-test-id={`template-task-section-${containerId}`} {...hoverBind}>
      <div
        className="flex items-center justify-between border-b border-surface-outline bg-surface-dimmed px-4 py-3"
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
      />
    </section>
  );
}
