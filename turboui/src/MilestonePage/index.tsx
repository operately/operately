import React, { useEffect, useRef, useState } from "react";
import { DateField } from "../DateField";
import { StatusBadge } from "../StatusBadge";
import TaskCreationModal from "../TaskBoard/components/TaskCreationModal";
import * as Types from "../TaskBoard/types";
import { TextField } from "../TextField";
import { Timeline } from "../Timeline";
import { IconClipboardText, IconFlag, IconListCheck, IconLogs, IconMessage, IconMessages } from "../icons";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { useTabs } from "../Tabs";
import { MilestoneDescription } from "./components/Description";
import { MilestoneSidebar } from "./components/Sidebar";
import { MentionedPersonLookupFn } from "../RichEditor";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";

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

    // Milestone
    milestone: Milestone;
    title: string;
    onMilestoneTitleChange: (name: string) => Promise<boolean>;
    dueDate: DateField.ContextualDate | null;
    onDueDateChange: (newDate: DateField.ContextualDate | null) => void;
    status: Types.Status;
    onStatusChange: (status: Types.Status) => void;
    description: any;
    onDescriptionChange: (newDescription: any) => Promise<boolean>;

    // Tasks for this milestone
    tasks: Types.Task[];

    // Optional callbacks
    onTaskCreate?: (task: Types.NewTaskPayload) => void;
    onTaskReorder?: (tasks: Types.Task[]) => void;
    onCommentCreate?: (comment: string) => void;
    onTaskAssigneeChange?: (taskId: string, assignee: Types.Person | null) => void;
    onTaskDueDateChange?: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskStatusChange?: (taskId: string, status: string) => void;

    searchPeople: SearchFn;

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
    mentionedPersonLookup?: MentionedPersonLookupFn;
    mentionedPeopleSearch?: SearchFn;
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
    title,
    onMilestoneTitleChange,
    status,
    searchPeople,
    timelineItems = [],
    currentUser,
    canComment = false,
    onAddComment,
    onEditComment,
    canEdit = true,
    description,
    onDescriptionChange,
    mentionedPersonLookup,
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
                      text={title}
                      onChange={onMilestoneTitleChange}
                      readonly={!canEdit}
                      trimBeforeSave
                    />
                    <StatusBadge
                      status={status === "done" ? "completed" : "in_progress"}
                      customLabel={status === "done" ? undefined : "Active"}
                      hideIcon={true}
                    />
                  </div>
                </div>

                {/* Description section */}
                <MilestoneDescription
                  description={description}
                  onDescriptionChange={onDescriptionChange}
                  mentionedPersonLookup={mentionedPersonLookup}
                  peopleSearch={state.mentionedPeopleSearch}
                  canEdit={canEdit}
                />

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
                  <MilestoneSidebar {...state} />
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

