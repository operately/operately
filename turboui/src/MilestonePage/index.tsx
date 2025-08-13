import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AvatarWithName } from "../Avatar";
import { GhostButton, PrimaryButton, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import FormattedTime from "../FormattedTime";
import { NotificationToggle } from "../NotificationToggle";
import { PieChart } from "../PieChart";
import RichContent, { countCharacters, shortenContent } from "../RichContent";
import { isContentEmpty } from "../RichContent/isContentEmpty";
import { Editor, useEditor } from "../RichEditor";
import { StatusBadge } from "../StatusBadge";
import { calculateMilestoneStats } from "../TaskBoard/components/MilestoneCard";
import TaskCreationModal from "../TaskBoard/components/TaskCreationModal";
import { FilterBadges, TaskFilter } from "../TaskBoard/components/TaskFilter";
import { TaskList } from "../TaskBoard/components/TaskList";
import * as Types from "../TaskBoard/types";
import { reorderTasksInList } from "../TaskBoard/utils/taskReorderingUtils";
import { TextField } from "../TextField";
import { Timeline } from "../Timeline";
import { IconArchive, IconCalendar, IconCheck, IconFlag, IconLink, IconPlus, IconTrash } from "../icons";
import { DragAndDropProvider } from "../utils/DragAndDrop";

// Calculate completion percentage for a milestone, excluding canceled tasks
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

interface MilestonePageProps {
  // Milestone to display
  milestone: Types.Milestone;

  // Tasks for this milestone
  tasks: Types.Task[];

  // All milestones for context
  milestones?: Types.Milestone[];

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

export function MilestonePage({
  milestone,
  tasks,
  milestones,
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
}: MilestonePageProps) {
  // State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHeaderStuck, setIsHeaderStuck] = useState(false);

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

  return (
    <div className="flex flex-col h-full bg-surface-base">
      <div className="flex-1 overflow-auto">
        <div className="px-4">
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
        milestones={milestones || [milestone]}
      />
    </div>
  );
}

// Sidebar component for milestone details
interface MilestoneSidebarProps {
  milestone: Types.Milestone;
  onDueDateChange?: (milestoneId: string, dueDate: DateField.ContextualDate | null) => void;
  onMilestoneUpdate?: (milestoneId: string, updates: Types.UpdateMilestonePayload) => void;
  createdBy?: Types.Person;
  createdAt?: Date;
  isSubscribed?: boolean;
  onSubscriptionToggle?: (subscribed: boolean) => void;
  onCopyUrl?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}

function MilestoneSidebar({
  milestone,
  onDueDateChange,
  onMilestoneUpdate,
  createdBy,
  createdAt,
  isSubscribed = false,
  onSubscriptionToggle,
  onCopyUrl,
  onArchive,
  onDelete,
  canEdit = true,
}: MilestoneSidebarProps) {
  return (
    <>
      <SidebarDueDate milestone={milestone} onDueDateChange={onDueDateChange} canEdit={canEdit} />
      <SidebarStatus milestone={milestone} onMilestoneUpdate={onMilestoneUpdate} canEdit={canEdit} />
      {createdBy && createdAt && <SidebarCreatedBy createdBy={createdBy} createdAt={createdAt} />}
      <SidebarNotifications isSubscribed={isSubscribed} onSubscriptionToggle={onSubscriptionToggle} />
      <SidebarActions onCopyUrl={onCopyUrl} onArchive={onArchive} onDelete={onDelete} canEdit={canEdit} />
    </>
  );
}

function SidebarSection({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="font-bold text-sm">{title}</div>
      {children}
    </div>
  );
}

function SidebarDueDate({
  milestone,
  onDueDateChange,
  canEdit,
}: {
  milestone: Types.Milestone;
  onDueDateChange?: (milestoneId: string, dueDate: DateField.ContextualDate | null) => void;
  canEdit: boolean;
}) {
  return (
    <SidebarSection title="Due Date">
      <DateField
        date={milestone.dueDate || null}
        onDateSelect={(date) => {
          if (onDueDateChange) {
            onDueDateChange(milestone.id, date);
          }
        }}
        readonly={!canEdit}
        showOverdueWarning={true}
        placeholder="Set due date"
      />
    </SidebarSection>
  );
}

function SidebarStatus({
  milestone,
  onMilestoneUpdate,
  canEdit,
}: {
  milestone: Types.Milestone;
  onMilestoneUpdate?: (milestoneId: string, updates: Types.UpdateMilestonePayload) => void;
  canEdit: boolean;
}) {
  // Assume milestone has a status field (you may need to add this to Types.Milestone)
  const isCompleted = milestone.status === "done";

  const handleStatusToggle = () => {
    if (onMilestoneUpdate) {
      // Toggle the completion status (stored as any property for demo)
      const newStatus = isCompleted ? "active" : "completed";
      // Pass status info through the callback - parent would handle this
      onMilestoneUpdate(milestone.id, { ...milestone, status: newStatus } as any);
    }
  };

  if (!canEdit) {
    return (
      <SidebarSection title="Milestone status">
        <div className="text-sm text-content-base">{isCompleted ? "Completed" : "Active"}</div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="Milestone status">
      <div className="space-y-2">
        <div className="text-sm text-content-base">{isCompleted ? "Completed" : "Active"}</div>
        {isCompleted ? (
          <SecondaryButton size="xs" onClick={handleStatusToggle}>
            Reopen
          </SecondaryButton>
        ) : (
          <GhostButton size="xs" icon={IconCheck} onClick={handleStatusToggle}>
            Mark complete
          </GhostButton>
        )}
      </div>
    </SidebarSection>
  );
}

function SidebarCreatedBy({ createdBy, createdAt }: { createdBy: Types.Person; createdAt: Date }) {
  return (
    <SidebarSection title="Created">
      <div className="space-y-2 text-sm">
        <AvatarWithName person={createdBy} size="tiny" nameFormat="short" link={`/people/${createdBy.id}`} />
        <div className="flex items-center gap-1.5 ml-1 text-content-dimmed text-xs">
          <IconCalendar size={14} />
          <FormattedTime time={createdAt} format="short-date" />
        </div>
      </div>
    </SidebarSection>
  );
}

function SidebarNotifications({
  isSubscribed,
  onSubscriptionToggle,
}: {
  isSubscribed: boolean;
  onSubscriptionToggle?: (subscribed: boolean) => void;
}) {
  const handleToggle = (subscribed: boolean) => {
    if (onSubscriptionToggle) {
      onSubscriptionToggle(subscribed);
    }
  };

  return (
    <SidebarSection title="Notifications">
      <NotificationToggle isSubscribed={isSubscribed} onToggle={handleToggle} entityType="milestone" />
    </SidebarSection>
  );
}

function SidebarActions({
  onCopyUrl,
  onArchive,
  onDelete,
  canEdit,
}: {
  onCopyUrl?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  canEdit: boolean;
}) {
  const actions = [
    {
      label: "Copy URL",
      onClick: onCopyUrl,
      icon: IconLink,
      show: !!onCopyUrl,
    },
    {
      label: "Archive",
      onClick: onArchive,
      icon: IconArchive,
      show: !!onArchive,
    },
    {
      label: "Delete",
      onClick: onDelete,
      icon: IconTrash,
      show: canEdit && !!onDelete,
      danger: true,
    },
  ].filter((action) => action.show);

  if (actions.length === 0) return null;

  return (
    <SidebarSection title="Actions">
      <div className="space-y-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center gap-2 text-xs hover:bg-surface-highlight rounded px-2 py-1 -mx-2 w-full text-left ${
              action.danger ? "text-content-error hover:bg-red-50" : ""
            }`}
          >
            <action.icon size={16} className={action.danger ? "text-content-error" : "text-content-dimmed"} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </SidebarSection>
  );
}

// TaskPage-style description component for milestones
interface MilestoneDescriptionProps {
  description?: any;
  onDescriptionChange?: (newDescription: any) => Promise<boolean>;
  mentionedPersonLookup?: (id: string) => Types.Person | undefined;
  peopleSearch?: (params: { query: string }) => Promise<Types.Person[]>;
  canEdit: boolean;
}

function MilestoneDescription({
  description,
  onDescriptionChange,
  mentionedPersonLookup,
  peopleSearch,
  canEdit,
}: MilestoneDescriptionProps) {
  const descriptionState = useMilestoneDescriptionState({
    description,
    onDescriptionChange,
    mentionedPersonLookup,
    peopleSearch,
  });

  if (descriptionState.mode === "zero" && !canEdit) return null;

  if (descriptionState.mode === "zero") {
    return (
      <div>
        <button
          onClick={descriptionState.startEdit}
          className="text-content-dimmed hover:text-content-base text-sm transition-colors cursor-pointer"
        >
          Add details about this milestone...
        </button>
      </div>
    );
  }

  const editButton = (
    <SecondaryButton size="xxs" onClick={descriptionState.startEdit}>
      Edit
    </SecondaryButton>
  );

  return (
    <div>
      <SectionHeader title="Notes" buttons={editButton} showButtons={canEdit && descriptionState.mode !== "edit"} />

      {descriptionState.mode === "view" && <MilestoneDescriptionContent state={descriptionState} />}
      {descriptionState.mode === "edit" && <MilestoneDescriptionEditor state={descriptionState} />}
    </div>
  );
}

function SectionHeader({
  title,
  buttons,
  showButtons,
}: {
  title: string;
  buttons?: React.ReactNode;
  showButtons?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-bold">{title}</h2>
      {showButtons && buttons}
    </div>
  );
}

function MilestoneDescriptionContent({ state }: { state: MilestoneDescriptionState }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const length = useMemo(() => {
    return state.description ? countCharacters(state.description, { skipParse: true }) : 0;
  }, [state.description]);

  const displayedDescription = useMemo(() => {
    if (length <= 200) {
      return state.description;
    } else if (isExpanded) {
      return state.description;
    } else {
      return shortenContent(state.description!, 200, { suffix: "...", skipParse: true });
    }
  }, [state.description, length, isExpanded]);

  return (
    <div className="mt-2">
      <RichContent
        content={displayedDescription}
        mentionedPersonLookup={async (id: string) => {
          const person = state.mentionedPersonLookup?.(id);
          if (!person) return null;
          return {
            id: person.id,
            fullName: person.fullName,
            avatarUrl: person.avatarUrl,
            title: "",
            profileLink: `/people/${person.id}`,
          };
        }}
      />

      {length > 200 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-content-dimmed hover:underline text-sm mt-1 font-medium"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );
}

function MilestoneDescriptionEditor({ state }: { state: MilestoneDescriptionState }) {
  return (
    <div className="mt-2">
      <Editor editor={state.editor} />
      <div className="flex gap-2 mt-2">
        <PrimaryButton size="xs" onClick={state.save}>
          Save
        </PrimaryButton>
        <SecondaryButton size="xs" onClick={state.cancel}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}

interface MilestoneDescriptionState {
  description: string | null;
  mode: "view" | "edit" | "zero";
  setMode: React.Dispatch<React.SetStateAction<"view" | "edit" | "zero">>;
  setDescription: React.Dispatch<React.SetStateAction<string | null>>;
  editor: ReturnType<typeof useEditor>;
  mentionedPersonLookup?: (id: string) => Types.Person | undefined;
  startEdit: () => void;
  save: () => void;
  cancel: () => void;
}

function useMilestoneDescriptionState({
  description: initialDescription,
  onDescriptionChange,
  mentionedPersonLookup,
  peopleSearch,
}: {
  description?: any;
  onDescriptionChange?: (newDescription: any) => Promise<boolean>;
  mentionedPersonLookup?: (id: string) => Types.Person | undefined;
  peopleSearch?: (params: { query: string }) => Promise<Types.Person[]>;
}): MilestoneDescriptionState {
  const initialMode = isContentEmpty(initialDescription) ? "zero" : "view";

  const [description, setDescription] = useState<string | null>(initialDescription || null);
  const [mode, setMode] = useState<"view" | "edit" | "zero">(initialMode);

  useEffect(() => {
    setDescription(initialDescription || null);
  }, [initialDescription]);

  // Convert TaskBoard Person to RichEditor Person format
  const editorMentionLookup = async (id: string) => {
    const person = mentionedPersonLookup?.(id);
    if (!person) return null;
    return {
      id: person.id,
      fullName: person.fullName,
      avatarUrl: person.avatarUrl,
      title: "", // TaskBoard Person doesn't have title
      profileLink: `/people/${person.id}`, // Generate profile link
    };
  };

  // Convert TaskBoard peopleSearch to RichEditor format
  const editorPeopleSearch = async (params: { query: string }) => {
    if (!peopleSearch) return [];
    const people = await peopleSearch(params);
    return people.map((person) => ({
      id: person.id,
      fullName: person.fullName,
      avatarUrl: person.avatarUrl,
      title: "", // TaskBoard Person doesn't have title
      profileLink: `/people/${person.id}`, // Generate profile link
    }));
  };

  const editor = useEditor({
    content: initialDescription,
    editable: true,
    placeholder: "Describe the milestone...",
    mentionedPersonLookup: editorMentionLookup,
    peopleSearch: editorPeopleSearch,
  });

  const save = useCallback(async () => {
    if (!onDescriptionChange) return;

    const content = editor.getJson();
    const success = await onDescriptionChange(content);

    if (success) {
      setDescription(content);

      if (isContentEmpty(content)) {
        setMode("zero");
      } else {
        setMode("view");
      }
    }
  }, [editor, setDescription, setMode, onDescriptionChange]);

  const cancel = useCallback(() => {
    if (isContentEmpty(description)) {
      setMode("zero");
    } else {
      setMode("view");
    }
  }, [setMode, description]);

  const startEdit = useCallback(() => {
    editor.setContent(initialDescription);
    editor.setFocused(true);
    setMode("edit");
  }, [setMode, editor, initialDescription]);

  return {
    description,
    mode,
    editor,
    mentionedPersonLookup,
    startEdit,
    setMode,
    setDescription,
    save,
    cancel,
  };
}

export default MilestonePage;
