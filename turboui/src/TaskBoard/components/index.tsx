import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { reorderTasks } from "../utils/taskReorderingUtils";
import * as Types from "../types";
import { IconPlus } from "../../icons";
import TaskCreationModal from "./TaskCreationModal";
import MilestoneCreationModal from "./MilestoneCreationModal";
import { TaskList } from "./TaskList";
import { MilestoneCard } from "./MilestoneCard";
import { TaskFilter, FilterBadges } from "./TaskFilter";
import { useFilteredTasks } from "../hooks";
import { InlineTaskCreator, InlineTaskCreatorHandle } from "./InlineTaskCreator";
import hotkeys from "hotkeys-js";

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
  onTaskCreate,
  onMilestoneCreate,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskStatusChange,
  onTaskMilestoneChange,
  onMilestoneUpdate,
  searchPeople,
  filters = [],
  onFiltersChange,
}: Types.TaskBoardProps) {
  const [internalTasks, setInternalTasks] = useState<Types.Task[]>(externalTasks);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [activeTaskMilestoneId, setActiveTaskMilestoneId] = useState<string | undefined>();
  const [noMilestoneCreatorOpen, setNoMilestoneCreatorOpen] = useState(false);
  const noMilestoneCreatorRef = useRef<InlineTaskCreatorHandle | null>(null);
  const noMilestoneHoveredRef = useRef(false);

  // Keep internal tasks in sync with external tasks
  useEffect(() => {
    setInternalTasks(externalTasks);
  }, [externalTasks]);

  // Apply filters to tasks and track hidden tasks
  const { filteredTasks, hiddenTasksByMilestone, hiddenTasks, showHiddenTasksToggle } = useFilteredTasks(
    internalTasks,
    externalMilestones,
    filters,
  );

  const groupedTasks = useMemo(() => groupTasksByMilestone(filteredTasks), [filteredTasks]);
  const milestones = useMemo(
    () => getMilestonesWithStats(externalMilestones, internalTasks),
    [externalMilestones, internalTasks],
  );
  const showNoTasksMsg = milestones.length === 0 && hiddenTasks.length === 0 && filteredTasks.length === 0;

  // Check if there are any tasks without milestones in the original task list (memoized)
  const hasTasksWithoutMilestone = useMemo(
    () => internalTasks.some((task) => !task.milestone && !task._isHelperTask),
    [internalTasks],
  );

  // Bind 'c' for the No milestone section when it's hovered
  useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      const target = evt.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable = !!target && (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
      if (isEditable) return;
      if (!noMilestoneHoveredRef.current) return;
      evt.preventDefault();
      // @ts-ignore
      if (typeof evt.stopImmediatePropagation === "function") evt.stopImmediatePropagation();
      else evt.stopPropagation();
      setNoMilestoneCreatorOpen(true);
      setTimeout(() => noMilestoneCreatorRef.current?.focus(), 0);
    };
    hotkeys("c", handler);
    return () => hotkeys.unbind("c", handler);
  }, []);

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
    <div className="flex flex-col flex-1 bg-surface-base rounded-lg overflow-hidden" data-test-id="tasks-board">
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={onTaskCreate}
        milestones={milestones.map((m) => m.milestone)}
        currentMilestoneId={activeTaskMilestoneId}
        searchPeople={searchPeople}
        people={internalTasks
          .flatMap((task) => task.assignees || [])
          .filter((person, index, self) => index === self.findIndex((p) => p.id === person.id))}
      />

      <MilestoneCreationModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onCreateMilestone={(attrs) => onMilestoneCreate?.(attrs)}
      />

      <StickyActionBar
        setActiveTaskMilestoneId={setActiveTaskMilestoneId}
        setIsTaskModalOpen={setIsTaskModalOpen}
        onFiltersChange={onFiltersChange}
        filters={filters}
        internalTasks={internalTasks}
      />

      <div className="flex-1 overflow-auto">
        <DragAndDropProvider onDrop={handleTaskReorder}>
          <div className="overflow-x-auto bg-surface-base">
            <ul className="w-full">
              {/* If no tasks at all */}
              {showNoTasksMsg && <li className="py-4 text-center text-content-subtle">No tasks found</li>}

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
                  searchPeople={searchPeople}
                  availableMilestones={milestones.map((m) => m.milestone)}
                  availablePeople={internalTasks
                    .flatMap((task) => task.assignees || [])
                    .filter((person, index, self) => index === self.findIndex((p) => p.id === person.id))}
                />
              ))}

              {/* Tasks with no milestone */}
              {hasTasksWithoutMilestone && (
                <li
                  onMouseEnter={() => (noMilestoneHoveredRef.current = true)}
                  onMouseLeave={() => (noMilestoneHoveredRef.current = false)}
                >
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
                      onClick={() => {
                        setNoMilestoneCreatorOpen(true);
                        setTimeout(() => noMilestoneCreatorRef.current?.focus(), 0);
                      }}
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
                    searchPeople={searchPeople}
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
                          onCancel={() => setNoMilestoneCreatorOpen(false)}
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
  );
}

interface ActionBarProps {
  setActiveTaskMilestoneId: (id: string | undefined) => void;
  setIsTaskModalOpen: (open: boolean) => void;
  onFiltersChange?: (filters: Types.FilterCondition[]) => void;
  filters: Types.FilterCondition[];
  internalTasks: Types.Task[];
}

function StickyActionBar({
  setActiveTaskMilestoneId,
  setIsTaskModalOpen,
  onFiltersChange,
  filters,
  internalTasks,
}: ActionBarProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 border-b border-surface-outline bg-surface-base">
      <div className="flex flex-row items-center gap-4">
        <PrimaryButton
          size="xs"
          onClick={() => {
            setActiveTaskMilestoneId(null as unknown as string | undefined);
            setIsTaskModalOpen(true);
          }}
        >
          + New task
        </PrimaryButton>

        {/* Filter widget */}
        {onFiltersChange && <TaskFilter filters={filters} onFiltersChange={onFiltersChange} tasks={internalTasks} />}

        {/* Filter badges */}
        {onFiltersChange && <FilterBadges filters={filters} onFiltersChange={onFiltersChange} />}
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
    })
    .sort((a, b) => {
      const dateA = a.milestone.dueDate?.date;
      const dateB = b.milestone.dueDate?.date;

      // If both have due dates, sort by date (earlier dates first)
      if (dateA && dateB) {
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      }

      // If only one has a due date, prioritize the one with a due date
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

      // If neither has a due date, sort by milestone ID for consistency
      return a.milestone.id.localeCompare(b.milestone.id);
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
