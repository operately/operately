import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { TasksMenu } from "../TaskBoard";
import { TaskCreationModal } from "../TaskCreationModal";
import { TaskRow } from "./TaskRow";
import { MilestoneFormModal } from "./MilestoneFormModal";
import type { TemplateProjectPage } from ".";
import { projectItemsWithPlaceholder, SubtleDropPlaceholder, useBoardDnD } from "../utils/PragmaticDragAndDrop";
import type { BoardLocation, BoardMove } from "../utils/PragmaticDragAndDrop";
import { BlackLink } from "../Link";

const ROOT_TASKS_CONTAINER_ID = "no-milestone";

export function TaskBoard({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [isCreatingMilestone, setIsCreatingMilestone] = React.useState(false);
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col pb-8" data-test-id="template-task-board">
      {canEdit && (
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-surface-base px-4 py-4 sm:items-center sm:py-6 lg:px-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
            <PrimaryButton size="xs" onClick={() => setIsCreating(true)} testId="add-template-task">
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
        onClose={() => setIsCreating(false)}
        onCreateTask={(task) => props.onTaskCreate?.(task)}
        milestones={props.milestones}
        statuses={props.statuses}
        personSearch={props.personSearch}
        richTextHandlers={props.richTextHandlers}
      />
      <MilestoneFormModal
        isOpen={isCreatingMilestone}
        onClose={() => setIsCreatingMilestone(false)}
        onCreate={props.onMilestoneCreate}
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
              tasks={milestoneTasks}
              containerId={containerId}
              props={props}
              canEdit={canEdit}
              isDraggingEnabled={isDraggingEnabled}
              draggedItemId={activeDraggedItemId}
              destination={activeDestination}
              placeholderHeight={draggedItemDimensions?.height ?? null}
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
  tasks,
  containerId,
  props,
  canEdit,
  isDraggingEnabled,
  draggedItemId,
  destination,
  placeholderHeight,
}: {
  title: string;
  link?: string;
  tasks: TemplateProjectPage.Task[];
  containerId: string;
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  isDraggingEnabled: boolean;
  draggedItemId: string | null;
  destination: BoardLocation | null;
  placeholderHeight: number | null;
}) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const { items: projectedTasks, placeholderIndex } = React.useMemo(
    () =>
      projectItemsWithPlaceholder({
        items: tasks,
        getId: (task) => task.id,
        draggedItemId,
        targetLocation: destination,
        containerId,
      }),
    [containerId, destination, draggedItemId, tasks],
  );

  useEffect(() => {
    if (!isDraggingEnabled) return;

    const element = sectionRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ containerId, index: projectedTasks.length }),
    });
  }, [containerId, isDraggingEnabled, projectedTasks.length]);

  return (
    <section ref={sectionRef} data-test-id={`template-task-section-${containerId}`}>
      <div className="border-b border-surface-outline bg-surface-dimmed px-4 py-3 text-sm font-semibold">
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
      {projectedTasks.map((task, index) => (
        <React.Fragment key={task.id}>
          {placeholderIndex === index && (
            <SubtleDropPlaceholder containerId={containerId} index={index} height={placeholderHeight} />
          )}
          <TaskRow
            task={task}
            props={props}
            canEdit={canEdit}
            index={index}
            containerId={containerId}
            isDraggable={isDraggingEnabled}
          />
        </React.Fragment>
      ))}
      {placeholderIndex !== null && placeholderIndex === projectedTasks.length && (
        <SubtleDropPlaceholder containerId={containerId} index={projectedTasks.length} height={placeholderHeight} />
      )}
      {tasks.length === 0 && placeholderIndex === null && (
        <div className="px-4 py-3 text-sm text-content-dimmed">No tasks</div>
      )}
    </section>
  );
}
