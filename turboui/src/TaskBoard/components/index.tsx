import React, { useState, useCallback, useLayoutEffect, useMemo } from "react";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { useBoardDnD } from "../../utils/PragmaticDragAndDrop";
import type { BoardMove } from "../../utils/PragmaticDragAndDrop";
import { reorderTasks } from "../utils/taskReorderingUtils";
import * as Types from "../types";
import { IconPlus } from "../../icons";
import TaskCreationModal from "./TaskCreationModal";
import MilestoneCreationModal from "./MilestoneCreationModal";
import { TaskList } from "./TaskList";
import { MilestoneCard } from "./MilestoneCard";
import { TaskFilter, FilterBadges } from "./TaskFilter";
import { useFilteredTasks } from "../hooks";
import { InlineTaskCreator } from "./InlineTaskCreator";
import { useInlineTaskCreator } from "../hooks/useInlineTaskCreator";
import { TasksMenu } from "./TasksMenu";
import { TaskDisplayMenu } from "./TaskDisplayMenu";
import { StatusSelector } from "../../StatusSelector";

export { TaskDisplayMenu, TasksMenu };

export namespace TaskBoard {
  export type Person = Types.Person;

  export type Status = Types.Status;

  export type Milestone = Types.Milestone;

  export type Task = Types.Task;

  export type NewTaskPayload = Types.NewTaskPayload;
}

export function TaskBoard({
  tasks: externalTasks,
  milestones: externalMilestones = [],
  searchableMilestones,
  showMilestoneKanbanLink,
  onTaskCreate,
  onMilestoneCreate,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskStatusChange,
  onTaskMilestoneChange,
  onMilestoneUpdate,
  onMilestoneSearch,
  assigneePersonSearch,
  filters = [],
  onFiltersChange,
  onSaveCustomStatuses,
  statuses = [],
  canManageStatuses,
  canCreateMilestone,
  canCreateTask,
  displayMode = "list",
  onDisplayModeChange,
}: Types.TaskBoardProps) {
  const [internalTasks, setInternalTasks] = useState<Types.Task[]>(externalTasks);
  const [internalMilestones, setInternalMilestones] = useState<Types.Milestone[]>(externalMilestones);
  const [activeTaskMilestoneId, setActiveTaskMilestoneId] = useState<string | undefined>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const {
    open: noMilestoneCreatorOpen,
    openCreator: openNoMilestoneCreator,
    closeCreator: closeNoMilestoneCreator,
    creatorRef: noMilestoneCreatorRef,
    hoverBind: noMilestoneHoverBind,
  } = useInlineTaskCreator();

  // Keep internal tasks in sync with external tasks
  useLayoutEffect(() => {
    setInternalTasks(externalTasks);
  }, [externalTasks]);

  useLayoutEffect(() => {
    setInternalMilestones(externalMilestones);
  }, [externalMilestones]);

  // Apply filters to tasks
  const { filteredTasks, showHiddenTasksToggle } = useFilteredTasks(internalTasks, internalMilestones, filters);

  const groupedTasks = useMemo(() => groupTasksByMilestone(filteredTasks), [filteredTasks]);
  const milestones = useMemo(
    () => getMilestonesWithStats(internalMilestones, internalTasks),
    [internalMilestones, internalTasks],
  );

  const openTaskModal = useCallback((milestoneId: string | undefined) => {
    setActiveTaskMilestoneId(milestoneId);
    setIsTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
  }, []);

  const openMilestoneModal = useCallback(() => {
    setIsMilestoneModalOpen(true);
  }, []);

  const closeMilestoneModal = useCallback(() => {
    setIsMilestoneModalOpen(false);
  }, []);
  const showNoTasksMsg = milestones.length === 0 && filteredTasks.length === 0;

  // Check if there are any tasks without milestones in the original task list (memoized)
  const hasTasksWithoutMilestone = useMemo(
    () => internalTasks.some((task) => !task.milestone && !task._isHelperTask),
    [internalTasks],
  );

  const handleTaskMove = useCallback(
    (move: BoardMove) => {
      const dropZoneId = move.destination.containerId;
      const indexInDropZone = move.destination.index;

      if (onTaskMilestoneChange) {
        onTaskMilestoneChange(move.itemId, dropZoneId, indexInDropZone);
        return;
      }

      // Get all milestone objects for the utility function
      const allMilestones = milestones.map((m) => m.milestone);

      // Use the utility function to handle reordering
      const updatedTasks = reorderTasks(
        internalTasks,
        dropZoneId,
        move.itemId,
        indexInDropZone,
        { addHelperTasks: true },
        allMilestones,
      );

      // Update state with the reordered tasks
      setInternalTasks(updatedTasks);
    },
    [internalTasks, milestones, onTaskMilestoneChange],
  );

  const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(handleTaskMove);

  return (
    <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto pb-8">
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        onCreateTask={onTaskCreate}
        milestones={searchableMilestones}
        currentMilestoneId={activeTaskMilestoneId}
        assigneePersonSearch={assigneePersonSearch}
        onMilestoneSearch={onMilestoneSearch}
      />

      <MilestoneCreationModal
        isOpen={isMilestoneModalOpen}
        onClose={closeMilestoneModal}
        onCreateMilestone={(attrs) => {
          const newMilestone: Types.Milestone = {
            id:
              typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
                ? globalThis.crypto.randomUUID()
                : `temp-milestone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ...attrs,
          };

          setInternalMilestones((previous) => [...previous, newMilestone]);
          onMilestoneCreate?.(attrs);
        }}
      />

      <StickyActionBar
        openTaskModal={openTaskModal}
        openMilestoneModal={openMilestoneModal}
        onFiltersChange={onFiltersChange}
        filters={filters}
        internalTasks={internalTasks}
        onSaveCustomStatuses={onSaveCustomStatuses}
        statuses={statuses}
        canManageStatuses={canManageStatuses}
        canCreateMilestone={canCreateMilestone}
        canCreateTask={canCreateTask}
        displayMode={displayMode}
        onDisplayModeChange={onDisplayModeChange}
      />

      <div
        className="flex flex-col flex-1 bg-surface-base border border-surface-outline rounded-md overflow-hidden"
        data-test-id="tasks-board"
      >
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <ul className="w-full list-none m-0 p-0">
              {/* If no tasks at all */}
              {showNoTasksMsg && (
                <li className="py-4 text-center text-content-subtle">
                  No tasks yet — click 'New task' to create the first one.
                </li>
              )}

              {/* Milestones */}
              {milestones.map((milestoneData) => (
                <MilestoneCard
                  key={milestoneData.milestone.id}
                  milestone={milestoneData.milestone}
                  tasks={groupedTasks[milestoneData.milestone.id] || []}
                  showHiddenTasksToggle={showHiddenTasksToggle}
                  showKanbanLink={showMilestoneKanbanLink}
                  stats={milestoneData.stats}
                  onTaskCreate={onTaskCreate}
                  onTaskAssigneeChange={onTaskAssigneeChange}
                  onTaskDueDateChange={onTaskDueDateChange}
                  onTaskStatusChange={onTaskStatusChange}
                  onMilestoneUpdate={onMilestoneUpdate}
                  assigneePersonSearch={assigneePersonSearch}
                  statusOptions={statuses}
                  availableMilestones={milestones.map((m) => m.milestone)}
                  draggedItemId={draggedItemId}
                  targetLocation={destination}
                  placeholderHeight={draggedItemDimensions?.height ?? null}
                />
              ))}

              {/* Tasks with no milestone */}
              {hasTasksWithoutMilestone && (
                <li {...noMilestoneHoverBind}>
                  {/* No milestone header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-dimmed border-b border-surface-outline">
                    <div className="flex items-center gap-2">
                      {/* No progress pie chart for tasks without milestone */}
                      <span className="text-sm font-semibold text-content-base">No milestone</span>
                      {/* No indicators for 'No milestone' header */}
                    </div>
                    <SecondaryButton
                      size="xs"
                      icon={IconPlus}
                      onClick={openNoMilestoneCreator}
                      testId="no-milestone-add-task"
                    >
                      <span className="sr-only">Add task</span>
                    </SecondaryButton>
                  </div>

                  {/* Tasks with no milestone */}
                  <TaskList
                    tasks={groupedTasks["no_milestone"] || []}
                    showHiddenTasksToggle={showHiddenTasksToggle}
                    milestoneId="no-milestone"
                    onTaskAssigneeChange={onTaskAssigneeChange}
                    onTaskDueDateChange={onTaskDueDateChange}
                    onTaskStatusChange={onTaskStatusChange}
                    assigneePersonSearch={assigneePersonSearch}
                    statusOptions={statuses}
                    draggedItemId={draggedItemId}
                    targetLocation={destination}
                    placeholderHeight={draggedItemDimensions?.height ?? null}
                    inlineCreateRow={
                      noMilestoneCreatorOpen ? (
                        <InlineTaskCreator
                          ref={noMilestoneCreatorRef}
                          milestone={null}
                          onCreate={onTaskCreate}
                          onRequestAdvanced={() => {
                            setActiveTaskMilestoneId("no-milestone");
                          }}
                          onCancel={closeNoMilestoneCreator}
                          autoFocus
                          testId="inline-task-creator-no-milestone"
                        />
                      ) : undefined
                    }
                  />
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActionBarProps {
  openTaskModal: (milestoneId: string | undefined) => void;
  openMilestoneModal: () => void;
  onFiltersChange?: (filters: Types.FilterCondition[]) => void;
  filters: Types.FilterCondition[];
  internalTasks: Types.Task[];
  onSaveCustomStatuses: (data: {
    nextStatuses: StatusSelector.StatusOption[];
    deletedStatusReplacements: Record<string, string>;
  }) => void;
  statuses: StatusSelector.StatusOption[];
  canManageStatuses: boolean;
  canCreateMilestone: boolean;
  canCreateTask: boolean;
  displayMode: Types.TaskDisplayMode;
  onDisplayModeChange: (mode: Types.TaskDisplayMode) => void;
}

function StickyActionBar({
  openTaskModal,
  openMilestoneModal,
  onFiltersChange,
  filters,
  internalTasks,
  onSaveCustomStatuses,
  statuses,
  canManageStatuses,
  canCreateMilestone,
  canCreateTask,
  displayMode,
  onDisplayModeChange,
}: ActionBarProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 bg-surface-base px-4 lg:px-0">
      <div className="flex flex-row items-center gap-4">
        {canCreateTask && (
          <PrimaryButton
            size="xs"
            onClick={() => {
              openTaskModal(undefined);
            }}
            testId="add-task"
          >
            New task
          </PrimaryButton>
        )}

        {canCreateMilestone && (
          <SecondaryButton size="xs" onClick={openMilestoneModal} testId="add-milestone">
            New milestone
          </SecondaryButton>
        )}

        {/* Filter widget */}
        {onFiltersChange && <TaskFilter filters={filters} onFiltersChange={onFiltersChange} tasks={internalTasks} />}

        {/* Filter badges */}
        {onFiltersChange && <FilterBadges filters={filters} onFiltersChange={onFiltersChange} />}
      </div>

      <div className="flex items-center -mb-2">
        <TasksMenu
          canManageStatuses={canManageStatuses}
          statuses={statuses}
          onSaveCustomStatuses={onSaveCustomStatuses}
        />

        <TaskDisplayMenu mode={displayMode} onChange={onDisplayModeChange} />
      </div>
    </header>
  );
}

const getMilestonesWithStats = (allMilestones: Types.Milestone[] | undefined, originalTasks: Types.Task[]) => {
  type MilestoneStats = Types.MilestoneStats;

  // If no milestones provided, derive them from tasks (backward compatibility)
  let milestonesToProcess: Types.Milestone[];

  if (!allMilestones || allMilestones.length === 0) {
    const milestoneMap = new Map<string, Types.Milestone>();
    originalTasks.forEach((task) => {
      if (task.milestone && !milestoneMap.has(task.milestone.id)) {
        milestoneMap.set(task.milestone.id, task.milestone);
      }
    });
    milestonesToProcess = Array.from(milestoneMap.values());
  } else {
    milestonesToProcess = allMilestones;
  }

  return milestonesToProcess
    .filter((milestone) => milestone.status !== "done")
    .map((milestone) => {
      const stats: MilestoneStats = { pending: 0, inProgress: 0, done: 0, canceled: 0, total: 0 };
      let hasTasks = false;

      // Calculate statistics from ALL original tasks for this milestone
      originalTasks.forEach((task) => {
        if (task.milestone?.id === milestone.id && !task._isHelperTask) {
          hasTasks = true;
          stats.total++;

          switch (task.status?.color) {
            case "gray":
              stats.pending++;
              break;
            case "blue":
              stats.inProgress++;
              break;
            case "green":
              stats.done++;
              break;
            case "red":
              stats.canceled++;
              break;
          }
        }
      });

      return {
        milestone,
        stats,
        hasTasks,
      };
    });
};

const groupTasksByMilestone = (tasks: Types.Task[]) => {
  const grouped: Record<string, Types.Task[]> = {};

  // Group with no milestone
  grouped["no_milestone"] = [];

  // First create all milestone groups
  tasks.forEach((task) => {
    if (task.milestone) {
      const milestoneId = task.milestone.id;
      if (!grouped[milestoneId]) {
        grouped[milestoneId] = [];
      }
    }
  });

  // Then add tasks to appropriate groups, filtering out helper tasks
  tasks.forEach((task) => {
    // Skip helper tasks used for empty milestones
    if (task._isHelperTask) {
      return;
    }

    if (task.milestone) {
      const milestoneId = task.milestone.id;
      grouped[milestoneId]?.push(task);
    } else {
      grouped["no_milestone"]?.push(task);
    }
  });

  return grouped;
};
