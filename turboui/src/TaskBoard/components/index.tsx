import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import { InlineTaskCreator } from "./InlineTaskCreator";
import { useInlineTaskCreator } from "../hooks/useInlineTaskCreator";
import classNames from "../../utils/classnames";

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
  const [internalMilestones, setInternalMilestones] = useState<Types.Milestone[]>(externalMilestones);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [activeTaskMilestoneId, setActiveTaskMilestoneId] = useState<string | undefined>();
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

  // Apply filters to tasks and track hidden tasks
  const { filteredTasks, hiddenTasksByMilestone, hiddenTasks, showHiddenTasksToggle } = useFilteredTasks(
    internalTasks,
    internalMilestones,
    filters,
  );

  const availablePeople = useMemo(
    () =>
      internalTasks
        .flatMap((task) => task.assignees || [])
        .filter((person, index, self) => index === self.findIndex((p) => p.id === person.id)),
    [internalTasks],
  );

  // Hotkey handled by useInlineTaskCreator

  const groupedTasks = useMemo(() => groupTasksByMilestone(filteredTasks), [filteredTasks]);
  const milestones = useMemo(
    () => getMilestonesWithStats(internalMilestones, internalTasks),
    [internalMilestones, internalTasks],
  );
  const handleDrop = useCallback(
    (dropZoneId: string, draggedId: string, indexInDropZone: number) => {
      if (onTaskMilestoneChange) {
        onTaskMilestoneChange(draggedId, dropZoneId, indexInDropZone);
      } else {
        const allMilestones = milestones.map((m) => m.milestone);

        const updatedTasks = reorderTasks(
          internalTasks,
          dropZoneId,
          draggedId,
          indexInDropZone,
          { addHelperTasks: true },
          allMilestones,
        );

        setInternalTasks(updatedTasks);
      }

      return true;
    },
    [internalTasks, milestones, onTaskMilestoneChange],
  );

  const showNoTasksMsg = milestones.length === 0 && hiddenTasks.length === 0 && filteredTasks.length === 0;

  // Check if there are any tasks without milestones in the original task list (memoized)
  const hasTasksWithoutMilestone = useMemo(
    () => internalTasks.some((task) => !task.milestone && !task._isHelperTask),
    [internalTasks],
  );

  return (
    <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto pb-8">
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={onTaskCreate}
        milestones={milestones.map((m) => m.milestone)}
        currentMilestoneId={activeTaskMilestoneId}
        searchPeople={searchPeople}
        people={availablePeople}
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
      />

      <div
        className="flex flex-col flex-1 bg-surface-base border border-surface-outline rounded-md overflow-hidden"
        data-test-id="tasks-board"
      >
        <div className="flex-1 overflow-auto">
          <DragAndDropProvider onDrop={handleDrop}>
            <div className="overflow-x-auto space-y-3">
              <MilestoneColumns
                milestonesWithStats={milestones}
                groupedTasks={groupedTasks}
                hiddenTasksByMilestone={hiddenTasksByMilestone}
                showHiddenTasksToggle={showHiddenTasksToggle}
                showNoTasksMsg={showNoTasksMsg}
                onTaskCreate={onTaskCreate}
                onTaskAssigneeChange={onTaskAssigneeChange}
                onTaskDueDateChange={onTaskDueDateChange}
                onTaskStatusChange={onTaskStatusChange}
                onMilestoneUpdate={onMilestoneUpdate}
                searchPeople={searchPeople}
                availableMilestones={milestones.map((entry) => entry.milestone)}
                availablePeople={availablePeople}
              />

              {hasTasksWithoutMilestone && (
                <div {...noMilestoneHoverBind}>
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-dimmed border-b border-surface-outline">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-content-base">No milestone</span>
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
                          onCancel={closeNoMilestoneCreator}
                          autoFocus
                          testId="inline-task-creator-no-milestone"
                        />
                      ) : undefined
                    }
                  />
                </div>
              )}
            </div>
          </DragAndDropProvider>
        </div>
      </div>
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
}

function StickyActionBar({
  setActiveTaskMilestoneId,
  setIsTaskModalOpen,
  setIsMilestoneModalOpen,
  onFiltersChange,
  filters,
  internalTasks,
}: ActionBarProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between  py-6 bg-surface-base">
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
    </header>
  );
}

interface MilestoneColumnsProps {
  milestonesWithStats: ReturnType<typeof getMilestonesWithStats>;
  groupedTasks: Record<string, Types.Task[]>;
  hiddenTasksByMilestone: Record<string, Types.Task[]>;
  showHiddenTasksToggle: boolean;
  showNoTasksMsg: boolean;
  onTaskCreate: Types.TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange: Types.TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange: Types.TaskBoardProps["onTaskDueDateChange"];
  onTaskStatusChange: Types.TaskBoardProps["onTaskStatusChange"];
  onMilestoneUpdate?: Types.TaskBoardProps["onMilestoneUpdate"];
  searchPeople?: Types.TaskBoardProps["searchPeople"];
  availableMilestones: Types.Milestone[];
  availablePeople: Types.Person[];
}

function MilestoneColumns({
  milestonesWithStats,
  groupedTasks,
  hiddenTasksByMilestone,
  showHiddenTasksToggle,
  showNoTasksMsg,
  onTaskCreate,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskStatusChange,
  onMilestoneUpdate,
  searchPeople,
  availableMilestones,
  availablePeople,
}: MilestoneColumnsProps) {
  const items: React.ReactNode[] = [];

  if (showNoTasksMsg) {
    items.push(
      <li key="no-tasks" className="py-4 text-center text-content-subtle">
        No tasks yet — click 'New task' to create the first one.
      </li>,
    );
  }

  milestonesWithStats.forEach((milestoneData) => {
    items.push(
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
        availableMilestones={availableMilestones}
        availablePeople={availablePeople}
      />,
    );
  });

  return <ul className={classNames("w-full list-none m-0 p-0 space-y-3 transition-colors")}>{items}</ul>;
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
