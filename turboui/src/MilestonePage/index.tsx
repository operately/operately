import React, { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "../Button";
import { DateField } from "../DateField";
import { PieChart } from "../PieChart";
import { StatusBadge } from "../StatusBadge";
import { calculateMilestoneStats } from "../TaskBoard/components/MilestoneCard";
import TaskCreationModal from "../TaskBoard/components/TaskCreationModal";
import { FilterBadges, TaskFilter } from "../TaskBoard/components/TaskFilter";
import { TaskList } from "../TaskBoard/components/TaskList";
import * as Types from "../TaskBoard/types";
import { reorderTasksInList } from "../TaskBoard/utils/taskReorderingUtils";
import { TextField } from "../TextField";
import { Timeline } from "../Timeline";
import { IconClipboardText, IconFlag, IconListCheck, IconLogs, IconMessage, IconMessages, IconPlus } from "../icons";
import { DragAndDropProvider } from "../utils/DragAndDrop";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { useTabs } from "../Tabs";
import { MilestoneDescription } from "./components/Description";
import { MilestoneSidebar } from "./components/Sidebar";

export namespace MilestonePage {
  export type Milestone = Types.Milestone;

  export interface Props {
    // Navigation info
    workmapLink: string;
    space: {
      id: string;
      name: string;
      link: string;
    };
    tasksCount?: number;

    // Project
    projectName: string;
    projectLink: string;
    projectStatus?: string;
    updateProjectName: (name: string) => Promise<boolean>;
  
    // Milestone to display
    milestone: Milestone;
  
    // Tasks for this milestone
    tasks: Types.Task[];
  
    // All milestones for context
  
    // Optional callbacks
    onStatusChange?: (taskId: string, newStatus: Types.Status) => void;
    onTaskCreate?: (task: Types.NewTaskPayload) => void;
    onTaskReorder?: (tasks: Types.Task[]) => void;
    onCommentCreate?: (comment: string) => void;
    onDueDateChange?: (milestoneId: string, dueDate: DateField.ContextualDate | null) => void;
  
    onTaskAssigneeChange?: (taskId: string, assignee: Types.Person | null) => void;
    onTaskDueDateChange?: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskStatusChange?: (taskId: string, status: string) => void;
    onMilestoneUpdate?: (milestoneId: string, updates: Types.UpdateMilestonePayload) => void;
    onMilestoneNameChange?: (name: string) => Promise<boolean>;
    searchPeople: (params: { query: string }) => Promise<Types.Person[]>;
  
    // Filtering
    filters?: Types.FilterCondition[];
    onFiltersChange?: (filters: Types.FilterCondition[]) => void;
  
    // Timeline data
    timelineItems?: any[];
    currentUser?: Types.Person;
    canComment?: boolean;
    onAddComment?: (comment: string) => void;
    onEditComment?: (commentId: string, content: string) => void;
  
    // Milestone metadata
    createdBy?: Types.Person;
    createdAt?: Date;
    isSubscribed?: boolean;
    onSubscriptionToggle?: (subscribed: boolean) => void;
    onCopyUrl?: () => void;
    onArchive?: () => void;
    onDelete?: () => void;
    canEdit?: boolean;
  
    // Rich editor support for description
    description?: any; // Rich content description
    onDescriptionChange?: (newDescription: any) => Promise<boolean>;
    mentionedPersonLookup?: (id: string) => Types.Person | undefined;
    peopleSearch?: (params: { query: string }) => Promise<Types.Person[]>;
  }

  export interface State extends Props {
    isTaskModalOpen: boolean;
    setIsTaskModalOpen: (open: boolean) => void;
    isHeaderStuck: boolean;
    setIsHeaderStuck: (stuck: boolean) => void;
  }
}


function useMilestonePageState(props: MilestonePage.Props): MilestonePage.State {
  // State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHeaderStuck, setIsHeaderStuck] = useState(false);

  return {
    ...props,
    isTaskModalOpen,
    setIsTaskModalOpen,
    isHeaderStuck,
    setIsHeaderStuck,
  };
}

export function MilestonePage(props: MilestonePage.Props) {
  const state = useMilestonePageState(props);
  const {
    milestone,
    tasks,
    onTaskCreate,
    onTaskReorder,
    onDueDateChange,
    onTaskAssigneeChange,
    onTaskDueDateChange,
    onTaskStatusChange,
    onMilestoneUpdate,
    onMilestoneNameChange,
    searchPeople,
    filters = [],
    onFiltersChange,
    timelineItems = [],
    currentUser,
    canComment = false,
    onAddComment,
    onEditComment,
    createdBy,
    createdAt,
    isSubscribed = false,
    onSubscriptionToggle,
    onCopyUrl,
    onArchive,
    onDelete,
    canEdit = true,
    description,
    onDescriptionChange,
    mentionedPersonLookup,
    peopleSearch,
    projectName,
    projectLink,
    projectStatus = "active",
    isTaskModalOpen,
    setIsTaskModalOpen,
    isHeaderStuck,
    setIsHeaderStuck,
  } = state;
  // Ref for the sentinel element (placed above sticky header)
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Calculate stats
  const stats = calculateMilestoneStats(tasks);
  const completionPercentage = calculateCompletionPercentage(stats);

  // Set up intersection observer to detect when header becomes stuck
  useEffect(() => {
    const sentinelElement = sentinelRef.current;
    if (!sentinelElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsHeaderStuck(!entry.isIntersecting);
        }
      },
      {
        threshold: 0,
        rootMargin: "0px",
      },
    );

    observer.observe(sentinelElement);
    return () => observer.disconnect();
  }, []);

  // Apply filters to tasks
  const applyFilters = (tasks: Types.Task[], filters: Types.FilterCondition[]) => {
    return tasks.filter((task) => {
      return filters.every((filter) => {
        switch (filter.type) {
          case "status":
            return filter.operator === "is" ? task.status === filter.value : task.status !== filter.value;
          case "assignee":
            const hasAssignee = task.assignees?.some((assignee) => assignee.id === filter.value?.id);
            return filter.operator === "is" ? hasAssignee : !hasAssignee;
          case "content":
            const searchTerm = filter.value?.toLowerCase() || "";
            const taskContent = `${task.title} ${task.description || ""}`.toLowerCase();
            return filter.operator === "contains"
              ? taskContent.includes(searchTerm)
              : !taskContent.includes(searchTerm);
          default:
            return true;
        }
      });
    });
  };

  // Filter tasks based on current filters
  const baseFilteredTasks = applyFilters(tasks, filters);

  // Separate visible tasks from hidden (completed) tasks
  const visibleTasks = baseFilteredTasks.filter((task) => task.status === "pending" || task.status === "in_progress");

  const hiddenTasks = baseFilteredTasks.filter((task) => task.status === "done" || task.status === "canceled");

  // Handle task creation
  const handleCreateTask = (newTask: Types.NewTaskPayload) => {
    if (onTaskCreate) {
      // Add the milestone to the task
      onTaskCreate({
        ...newTask,
        milestone: milestone,
      });
    }
    setIsTaskModalOpen(false);
  };

  const tabs = useTabs(
    "milestone",
    [
      { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
      {
        id: "tasks",
        label: "Tasks",
        icon: <IconListCheck size={14} />,
        count: tasks.length,
      },
      { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} /> },
      { id: "discussions", label: "Discussions", icon: <IconMessages size={14} /> },
      { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    ],
    { urlPath: projectLink },
  );

  // Prepare props for ProjectPageLayout
  const layoutProps = {
    projectName: projectName,
    projectLink: projectLink,
    projectStatus: projectStatus,
    title: [projectName],
    testId: "milestone-page",
    tabs: tabs,
    status: projectStatus,
    updateProjectName: props.updateProjectName,
    closedAt: null,
    space: state.space,
    workmapLink: state.workmapLink,
    canEdit: canEdit,
  };

  return (
    <ProjectPageLayout {...layoutProps}>
      <div className="flex-1 overflow-scroll">
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-2">
            <div className="sm:grid sm:grid-cols-12">
              {/* Main content - left column (8 columns) */}
              <div className="sm:col-span-8 sm:px-4 space-y-6">
                {/* Sentinel element for intersection observer */}
                <div ref={sentinelRef} className="h-0"></div>

                {/* Header section with milestone info */}
                <div
                  className={`sticky top-0 bg-surface-base z-10 pb-2 pt-2 space-y-2 transition-all duration-200 ${
                    isHeaderStuck ? "border-b border-surface-outline shadow-sm" : ""
                  }`}
                >
                  {/* Title line: flag icon + milestone name + status badge */}
                  <div className="flex items-center gap-2">
                    <IconFlag size={20} className="text-blue-500" />
                    <TextField
                      className="font-semibold text-xl"
                      text={milestone.name}
                      onChange={onMilestoneNameChange || (async () => true)}
                      readonly={!canEdit}
                      trimBeforeSave
                    />
                    <StatusBadge
                      status={milestone.status === "done" ? "completed" : "in_progress"}
                      customLabel={milestone.status === "done" ? undefined : "Active"}
                      hideIcon={true}
                    />
                  </div>
                </div>

                {/* Description section */}
                <MilestoneDescription
                  description={description}
                  onDescriptionChange={onDescriptionChange}
                  mentionedPersonLookup={mentionedPersonLookup}
                  peopleSearch={peopleSearch}
                  canEdit={canEdit}
                />

                {/* Tasks section */}
                <div className="space-y-4">
                  {/* Task header container - visually groups all task-related controls */}
                  <div className="bg-surface-dimmed rounded-lg border border-surface-outline">
                    {/* Header bar with title, pie chart, and primary action */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-outline">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-6 flex items-center justify-center">
                          <PieChart
                            size={24}
                            slices={[
                              {
                                percentage: completionPercentage,
                                color: "var(--color-callout-success-content)",
                              },
                            ]}
                          />
                        </div>
                        <h2 className="font-bold">Tasks</h2>
                      </div>
                      <PrimaryButton size="xs" icon={IconPlus} onClick={() => setIsTaskModalOpen(true)}>
                        Add Task
                      </PrimaryButton>
                    </div>

                    {/* Filter controls */}
                    {onFiltersChange && (
                      <div className="flex items-center gap-3 px-4 py-2 border-b border-surface-outline">
                        <TaskFilter filters={filters} onFiltersChange={onFiltersChange} tasks={tasks} />
                        {filters.length > 0 && <FilterBadges filters={filters} onFiltersChange={onFiltersChange} />}
                      </div>
                    )}

                    {/* Task list content */}
                    <div className="bg-surface-base">
                      {visibleTasks.length === 0 && hiddenTasks.length === 0 ? (
                        /* Empty state */
                        <div className="px-4 py-8 text-center text-content-subtle">
                          <p className="text-sm">No tasks yet. Click "Add Task" to get started.</p>
                        </div>
                      ) : (
                        /* Task list with drag and drop */
                        <DragAndDropProvider
                          onDrop={(_, draggedId, index) => {
                            if (onTaskReorder) {
                              // Reorder only the visible tasks
                              const reorderedVisibleTasks = reorderTasksInList(visibleTasks, draggedId, index);
                              // Merge reordered visible tasks with hidden tasks to maintain complete list
                              const completeReorderedTasks = [...reorderedVisibleTasks, ...hiddenTasks];
                              onTaskReorder(completeReorderedTasks);
                              return true;
                            }
                            return false;
                          }}
                        >
                          <TaskList
                            tasks={visibleTasks}
                            hiddenTasks={hiddenTasks}
                            showHiddenTasksToggle={hiddenTasks.length > 0}
                            milestoneId={milestone.id}
                            onTaskAssigneeChange={onTaskAssigneeChange || (() => {})}
                            onTaskDueDateChange={onTaskDueDateChange || (() => {})}
                            onTaskStatusChange={onTaskStatusChange || (() => {})}
                            searchPeople={searchPeople}
                          />
                        </DragAndDropProvider>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold">Activity & Comments</h2>
                  </div>

                  <Timeline
                    items={timelineItems}
                    currentUser={
                      currentUser
                        ? {
                            id: currentUser.id,
                            fullName: currentUser.fullName,
                            avatarUrl: currentUser.avatarUrl || undefined,
                          }
                        : { id: "", fullName: "", avatarUrl: undefined }
                    }
                    canComment={canComment}
                    commentParentType="milestone"
                    onAddComment={onAddComment}
                    onEditComment={onEditComment}
                  />
                </div>
              </div>

              {/* Sidebar - right column (4 columns) */}
              <div className="sm:col-span-4 hidden sm:block sm:pl-8">
                {/* Add spacing to align with description section */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold opacity-0">{milestone.name}</h1>
                  </div>
                </div>

                <div className="space-y-6">
                  <MilestoneSidebar
                    milestone={milestone}
                    onDueDateChange={onDueDateChange}
                    onMilestoneUpdate={onMilestoneUpdate}
                    createdBy={createdBy}
                    createdAt={createdAt}
                    isSubscribed={isSubscribed}
                    onSubscriptionToggle={onSubscriptionToggle}
                    onCopyUrl={onCopyUrl}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    canEdit={canEdit}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Task creation modal */}
        <TaskCreationModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onCreateTask={handleCreateTask}
          searchPeople={searchPeople}
          currentMilestoneId={milestone.id}
          milestones={[]}
        />
      </div>
    </ProjectPageLayout>
  );
}

function calculateCompletionPercentage(stats: {
  pending: number;
  inProgress: number;
  done: number;
  canceled: number;
  total: number;
}) {
  // Active tasks are those that aren't canceled
  const activeTasks = stats.total - stats.canceled;

  // If there are no active tasks, show as 0% complete
  if (activeTasks === 0) return 0;

  // Calculate percentage based only on active tasks
  return (stats.done / activeTasks) * 100;
}

