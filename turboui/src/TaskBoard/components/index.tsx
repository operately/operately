import React, { useState, useCallback, useEffect, useMemo } from "react";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { reorderTasks } from "../utils/taskReorderingUtils";
import * as Types from "../types";
import { IconPlus, IconSettings } from "../../icons";
import TaskCreationModal from "./TaskCreationModal";
import MilestoneCreationModal from "./MilestoneCreationModal";
import { TaskList } from "./TaskList";
import { MilestoneCard } from "./MilestoneCard";
import { TaskFilter, FilterBadges } from "./TaskFilter";
import { useFilteredTasks } from "../hooks";
import { InlineTaskCreator } from "./InlineTaskCreator";
import { useInlineTaskCreator } from "../hooks/useInlineTaskCreator";
import { Menu, MenuActionItem } from "../../Menu";
import { StatusCustomizationModal, type StatusCustomizationStatus } from "../../StatusCustomization";

export namespace TaskBoard {
  export type Person = Types.Person;

  export type Status = Types.Status;

  export type Milestone = Types.Milestone;

  export type Task = Types.Task;

  export type NewTaskPayload = Types.NewTaskPayload;

  export type StatusCustomizationStatus = Types.StatusCustomizationStatus;
}

export function TaskBoard({
  tasks: externalTasks,
  milestones: externalMilestones = [],
  searchableMilestones,
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
  onManageStatusesClick,
  statuses = [],
}: Types.TaskBoardProps) {
  const [internalTasks, setInternalTasks] = useState<Types.Task[]>(externalTasks);
  const [internalMilestones, setInternalMilestones] = useState<Types.Milestone[]>(externalMilestones);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [activeTaskMilestoneId, setActiveTaskMilestoneId] = useState<string | undefined>();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalStatuses, setStatusModalStatuses] = useState<StatusCustomizationStatus[]>(statuses);
  const {
    open: noMilestoneCreatorOpen,
    openCreator: openNoMilestoneCreator,
    closeCreator: closeNoMilestoneCreator,
    creatorRef: noMilestoneCreatorRef,
    hoverBind: noMilestoneHoverBind,
  } = useInlineTaskCreator();

  // Keep internal tasks in sync with external tasks
  useEffect(() => {
    setInternalTasks(externalTasks);
  }, [externalTasks]);

  useEffect(() => {
    setInternalMilestones(externalMilestones);
  }, [externalMilestones]);

  useEffect(() => {
    setStatusModalStatuses(statuses);
  }, [statuses]);

  // Apply filters to tasks and track hidden tasks
  const { filteredTasks, hiddenTasksByMilestone, hiddenTasks, showHiddenTasksToggle } = useFilteredTasks(
    internalTasks,
    internalMilestones,
    filters,
  );

  const groupedTasks = useMemo(() => groupTasksByMilestone(filteredTasks), [filteredTasks]);
  const milestones = useMemo(
    () => getMilestonesWithStats(internalMilestones, internalTasks),
    [internalMilestones, internalTasks],
  );
  const showNoTasksMsg = milestones.length === 0 && hiddenTasks.length === 0 && filteredTasks.length === 0;

  // Check if there are any tasks without milestones in the original task list (memoized)
  const hasTasksWithoutMilestone = useMemo(
    () => internalTasks.some((task) => !task.milestone && !task._isHelperTask),
    [internalTasks],
  );

  const openStatusModal = useCallback(() => {
    setIsStatusModalOpen(true);
  }, []);

  const closeStatusModal = useCallback(() => {
    setIsStatusModalOpen(false);
  }, []);

  const handleSaveStatuses = useCallback(
    (nextStatuses: StatusCustomizationStatus[]) => {
      setStatusModalStatuses(nextStatuses);
      setIsStatusModalOpen(false);
      onManageStatusesClick(nextStatuses);
    },
    [onManageStatusesClick],
  );

  const handleTaskReorder = useCallback(
    (dropZoneId: string, draggedId: string, indexInDropZone: number) => {
      if (onTaskMilestoneChange) {
        onTaskMilestoneChange(draggedId, dropZoneId, indexInDropZone);
      } else {
        // Get all milestone objects for the utility function
        const allMilestones = milestones.map((m) => m.milestone);

        // Use the utility function to handle reordering
        const updatedTasks = reorderTasks(
          internalTasks,
          dropZoneId,
          draggedId,
          indexInDropZone,
          { addHelperTasks: true },
          allMilestones,
        );

        // Update state with the reordered tasks
        setInternalTasks(updatedTasks);
      }

      return true; // Successfully handled the reorder
    },
    [internalTasks, milestones, setInternalTasks],
  );

  return (
    <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto pb-8">
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={onTaskCreate}
        milestones={searchableMilestones}
        currentMilestoneId={activeTaskMilestoneId}
        assigneePersonSearch={assigneePersonSearch}
        onMilestoneSearch={onMilestoneSearch}
      />

      <MilestoneCreationModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
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
        setActiveTaskMilestoneId={setActiveTaskMilestoneId}
        setIsTaskModalOpen={setIsTaskModalOpen}
        setIsMilestoneModalOpen={setIsMilestoneModalOpen}
        onFiltersChange={onFiltersChange}
        filters={filters}
        internalTasks={internalTasks}
        openStatusModal={openStatusModal}
      />

      <div
        className="flex flex-col flex-1 bg-surface-base border border-surface-outline rounded-md overflow-hidden"
        data-test-id="tasks-board"
      >
        <div className="flex-1 overflow-auto">
          <DragAndDropProvider onDrop={handleTaskReorder}>
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
                    hiddenTasks={hiddenTasksByMilestone[milestoneData.milestone.id] || []}
                    showHiddenTasksToggle={showHiddenTasksToggle}
                    stats={milestoneData.stats}
                    onTaskCreate={onTaskCreate}
                    onTaskAssigneeChange={onTaskAssigneeChange}
                    onTaskDueDateChange={onTaskDueDateChange}
                    onTaskStatusChange={onTaskStatusChange}
                    onMilestoneUpdate={onMilestoneUpdate}
                    assigneePersonSearch={assigneePersonSearch}
                    availableMilestones={milestones.map((m) => m.milestone)}
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
                      hiddenTasks={hiddenTasksByMilestone["no_milestone"] || []}
                      showHiddenTasksToggle={showHiddenTasksToggle}
                      milestoneId="no-milestone"
                      onTaskAssigneeChange={onTaskAssigneeChange}
                      onTaskDueDateChange={onTaskDueDateChange}
                      onTaskStatusChange={onTaskStatusChange}
                      assigneePersonSearch={assigneePersonSearch}
                      inlineCreateRow={
                        noMilestoneCreatorOpen ? (
                          <InlineTaskCreator
                            ref={noMilestoneCreatorRef}
                            milestone={null}
                            onCreate={onTaskCreate}
                            onRequestAdvanced={() => {
                              setActiveTaskMilestoneId("no-milestone");
                              setIsTaskModalOpen(true);
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
          </DragAndDropProvider>
        </div>
      </div>

      <StatusCustomizationModal
        isOpen={isStatusModalOpen}
        onClose={closeStatusModal}
        statuses={statusModalStatuses}
        onSave={handleSaveStatuses}
      />
    </div>
  );
}

interface ActionBarProps {
  setActiveTaskMilestoneId: (id: string | undefined) => void;
  setIsTaskModalOpen: (open: boolean) => void;
  setIsMilestoneModalOpen: (open: boolean) => void;
  onFiltersChange?: (filters: Types.FilterCondition[]) => void;
  filters: Types.FilterCondition[];
  internalTasks: Types.Task[];
  openStatusModal: () => void;
}

function StickyActionBar({
  setActiveTaskMilestoneId,
  setIsTaskModalOpen,
  setIsMilestoneModalOpen,
  onFiltersChange,
  filters,
  internalTasks,
  openStatusModal,
}: ActionBarProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 bg-surface-base px-4 lg:px-0">
      <div className="flex flex-row items-center gap-4">
        <PrimaryButton
          size="xs"
          onClick={() => {
            setActiveTaskMilestoneId(null as unknown as string | undefined);
            setIsTaskModalOpen(true);
          }}
        >
          New task
        </PrimaryButton>

        <SecondaryButton size="xs" onClick={() => setIsMilestoneModalOpen(true)} testId="add-milestone">
          New milestone
        </SecondaryButton>

        {/* Filter widget */}
        {onFiltersChange && <TaskFilter filters={filters} onFiltersChange={onFiltersChange} tasks={internalTasks} />}

        {/* Filter badges */}
        {onFiltersChange && <FilterBadges filters={filters} onFiltersChange={onFiltersChange} />}
      </div>

      <Menu
        customTrigger={
          <button
            className="p-1.5 -mb-2 text-content-dimmed hover:text-content-base hover:bg-surface-dimmed rounded-full transition"
            aria-label="Settings"
          >
            <IconSettings size={20} />
          </button>
        }
        size="small"
        align="end"
      >
        <MenuActionItem icon={IconSettings} onClick={openStatusModal}>
          Manage statuses
        </MenuActionItem>
      </Menu>
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

          switch (task.status) {
            case "pending":
              stats.pending++;
              break;
            case "in_progress":
              stats.inProgress++;
              break;
            case "done":
              stats.done++;
              break;
            case "canceled":
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
