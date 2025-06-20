import React, { useState, useCallback, useEffect, useMemo } from "react";
import { PrimaryButton } from "../../Button";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { reorderTasks } from "../utils/taskReorderingUtils";
import { applyFilters } from "../utils/taskFilterUtils";
import * as Types from "../types";
import { IconPlus } from "@tabler/icons-react";
import TaskCreationModal from "./TaskCreationModal";
import MilestoneCreationModal from "./MilestoneCreationModal";
import { TaskList } from "./TaskList";
import { MilestoneCard } from "./MilestoneCard";
import { TaskFilter, FilterBadges } from "./TaskFilter";

export function TaskBoard({
  tasks: externalTasks,
  viewMode = "table",
  onStatusChange,
  onTaskCreate,
  onMilestoneCreate,
  onTaskUpdate,
  onMilestoneUpdate,
  searchPeople,
  filters = [],
  onFiltersChange,
}: Types.TaskBoardProps) {
  const [currentViewMode, setCurrentViewMode] = useState<Types.ViewMode>(viewMode);
  const [internalTasks, setInternalTasks] = useState<Types.Task[]>(externalTasks);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [activeTaskMilestoneId, setActiveTaskMilestoneId] = useState<string | undefined>();

  // Keep internal tasks in sync with external tasks
  useEffect(() => {
    setInternalTasks(externalTasks);
  }, [externalTasks]);

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    return applyFilters(internalTasks, filters);
  }, [internalTasks, filters]);

  // Group tasks by milestone, filtering out helper tasks
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

  // Get all unique milestones from tasks with completion statistics
  const getMilestones = (originalTasks: Types.Task[], filteredTasks: Types.Task[]) => {
    type MilestoneStats = Types.MilestoneStats;

    const milestoneMap = new Map<
      string,
      {
        milestone: Types.Milestone;
        stats: MilestoneStats;
        hasTasks: boolean;
      }
    >();

    // First, collect all milestones from unfiltered tasks to ensure we show all milestones
    originalTasks.forEach((task) => {
      if (task.milestone) {
        const milestoneId = task.milestone.id;

        if (!milestoneMap.has(milestoneId)) {
          milestoneMap.set(milestoneId, {
            milestone: task.milestone,
            stats: { pending: 0, inProgress: 0, done: 0, canceled: 0, total: 0 },
            hasTasks: false,
          });
        }

        // Check if this milestone has any real tasks (not helper tasks) in the original task list
        if (!task._isHelperTask) {
          milestoneMap.get(milestoneId)!.hasTasks = true;
        }
      }
    });

    // Then, calculate statistics from filtered tasks only
    filteredTasks.forEach((task) => {
      if (task.milestone && !task._isHelperTask) {
        const milestoneId = task.milestone.id;
        const milestoneData = milestoneMap.get(milestoneId);

        if (milestoneData) {
          // Update statistics
          const stats = milestoneData.stats;
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
      }
    });

    // Return milestones sorted by ID to maintain consistent ordering
    return Array.from(milestoneMap.values()).sort((a, b) => a.milestone.id.localeCompare(b.milestone.id));
  };

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: Types.Status) => {
    // Update local state
    const updatedTasks = internalTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
    setInternalTasks(updatedTasks);

    // Notify parent component if callback is provided
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  // Set up event listener for status changes from TaskItems
  useEffect(() => {
    const handleStatusChangeEvent = (e: Event) => {
      const { taskId, newStatus } = (e as CustomEvent).detail;
      handleStatusChange(taskId, newStatus);
    };

    document.addEventListener("statusChange", handleStatusChangeEvent);

    return () => {
      document.removeEventListener("statusChange", handleStatusChangeEvent);
    };
  }, [handleStatusChange]);

  // Handle creating a new task
  const handleCreateTask = (newTaskData: Omit<Types.Task, "id">) => {
    if (onTaskCreate) {
      // Log to confirm task creation event is being triggered
      console.log("TaskBoard: Creating new task", newTaskData);
      onTaskCreate(newTaskData);
    } else {
      console.warn("TaskBoard: onTaskCreate handler is not provided");
    }
  };

  // Handle creating a new milestone
  const handleCreateMilestone = (newMilestoneData: Omit<Types.Milestone, "id">) => {
    if (onMilestoneCreate) {
      // Log to confirm milestone creation event is being triggered
      console.log("TaskBoard: Creating new milestone", newMilestoneData);
      onMilestoneCreate(newMilestoneData);
    } else {
      console.warn("TaskBoard: onMilestoneCreate handler is not provided");
    }
  };

  // Group tasks by milestone and get milestone stats (memoized for performance)
  const groupedTasks = useMemo(() => groupTasksByMilestone(filteredTasks), [filteredTasks]);
  const milestones = useMemo(() => getMilestones(internalTasks, filteredTasks), [internalTasks, filteredTasks]);

  // Check if there are any tasks without milestones in the original task list (memoized)
  const hasTasksWithoutMilestone = useMemo(
    () => internalTasks.some((task) => !task.milestone && !task._isHelperTask),
    [internalTasks]
  );

  // Handle task reordering via drag and drop
  const handleTaskReorder = useCallback(
    (dropZoneId: string, draggedId: string, indexInDropZone: number) => {
      console.log(`Handling reorder: ${draggedId} to ${dropZoneId} at index ${indexInDropZone}`);

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

      console.log(`Reordered: Task ${draggedId} moved to ${dropZoneId} at position ${indexInDropZone}`);
    },
    [internalTasks, milestones, setInternalTasks],
  );

  return (
    <div className="flex flex-col flex-1 bg-surface-base rounded-lg overflow-hidden">
      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        milestones={milestones.map((m) => m.milestone)}
        currentMilestoneId={activeTaskMilestoneId}
        people={internalTasks
          .flatMap((task) => task.assignees || [])
          .filter((person, index, self) => index === self.findIndex((p) => p.id === person.id))}
      />

      {/* Milestone Creation Modal */}
      <MilestoneCreationModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onCreateMilestone={handleCreateMilestone}
      />

      {/* Sticky action bar */}
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
          {/* not yet sure but 'New milestone' button is probably not needed here */}
          {/* <SecondaryButton
            size="xs"
            onClick={() => {
              setIsMilestoneModalOpen(true);
            }}
          >
            + New milestone
          </SecondaryButton> */}

          {/* Filter widget */}
          {onFiltersChange && <TaskFilter filters={filters} onFiltersChange={onFiltersChange} tasks={internalTasks} />}

          {/* Filter badges */}
          {onFiltersChange && <FilterBadges filters={filters} onFiltersChange={onFiltersChange} />}
        </div>
        <div className="flex mt-2 sm:mt-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentViewMode("table")}
              className={`px-3 py-1 text-xs rounded-md ${
                currentViewMode === "table"
                  ? "bg-primary-base text-white"
                  : "bg-surface-accent text-content-base hover:bg-surface-accent-hover"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setCurrentViewMode("kanban")}
              className={`px-3 py-1 text-xs rounded-md ${
                currentViewMode === "kanban"
                  ? "bg-primary-base text-white"
                  : "bg-surface-accent text-content-base hover:bg-surface-accent-hover"
              }`}
            >
              Kanban
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {currentViewMode === "table" && (
          <DragAndDropProvider onDrop={handleTaskReorder}>
            <div className="overflow-x-auto bg-surface-base">
              <ul className="w-full">
                {/* If no tasks at all */}
                {filteredTasks.length === 0 && <li className="py-4 text-center text-content-subtle">No tasks found</li>}

                {/* Milestones */}
                {milestones.map((milestoneData) => (
                  <MilestoneCard
                    key={milestoneData.milestone.id}
                    milestone={milestoneData.milestone}
                    tasks={groupedTasks[milestoneData.milestone.id] || []}
                    stats={milestoneData.stats}
                    onTaskCreate={onTaskCreate ? (newTask) => onTaskCreate(newTask) : undefined}
                    onTaskUpdate={onTaskUpdate}
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
                  <li>
                    {/* No milestone header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-dimmed border-b border-surface-outline">
                      <div className="flex items-center gap-2">
                        {/* No progress pie chart for tasks without milestone */}
                        <span className="text-sm font-semibold text-content-base">No milestone</span>
                        {/* No indicators for 'No milestone' header */}
                      </div>
                      <button
                        className="text-content-subtle hover:text-content-base"
                        onClick={() => {
                          setActiveTaskMilestoneId("no-milestone");
                          setIsTaskModalOpen(true);
                        }}
                      >
                        <IconPlus size={16} />
                      </button>
                    </div>

                    {/* Tasks with no milestone */}
                    <TaskList
                      tasks={groupedTasks["no_milestone"] || []}
                      milestoneId="no-milestone"
                      onTaskUpdate={onTaskUpdate}
                      searchPeople={searchPeople}
                    />
                  </li>
                )}
              </ul>
            </div>
          </DragAndDropProvider>
        )}
        {currentViewMode === "kanban" && (
          <div className="flex h-full text-center text-content-subtle">
            <div className="m-auto p-6 border border-dashed border-surface-outline rounded-lg">
              Kanban view will be implemented here
            </div>
          </div>
        )}
        {currentViewMode === "timeline" && (
          <div className="flex h-full text-center text-content-subtle">
            <div className="m-auto p-6 border border-dashed border-surface-outline rounded-lg">
              Timeline view will be implemented here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskBoard;
