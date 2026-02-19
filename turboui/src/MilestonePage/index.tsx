import React, { useState } from "react";
import { DateField } from "../DateField";
import TaskCreationModal from "../TaskBoard/components/TaskCreationModal";
import * as Types from "../TaskBoard/types";
import { Timeline } from "../Timeline";
import {
  IconCheck,
  IconClipboardText,
  IconFlag,
  IconFlagFilled,
  IconListCheck,
  IconLogs,
  IconMessage,
  IconMessages,
} from "../icons";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { useTabs } from "../Tabs";
import { MilestoneSidebar } from "./components/Sidebar";
import { DeleteModal } from "./components/DeleteModal";
import { PersonField } from "../PersonField";
import { TimelineItem } from "../Timeline/types";
import { Header } from "./components/Header";
import { TasksSection } from "./components/TasksSection";
import { SidebarSection } from "../SidebarSection";
import { GhostButton, SecondaryButton } from "../Button";
import { launchConfetti } from "../utils/confetti";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { PageDescription } from "../PageDescription";
import { SidebarNotificationSection } from "../SidebarSection";
import { ProjectPermissions } from "../ProjectPage/types";

export namespace MilestonePage {
  export type Milestone = Types.Milestone;

  export type TimelineItemType = TimelineItem;

  interface Space {
    id: string;
    name: string;
    link: string;
  }

  export type SpaceProps =
    | {
        workmapLink: string;
        space: Space;
      }
    | {
        homeLink: string;
      };

  export type Person = {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    profileLink: string;
  };

  export type Status = "pending" | "done";

  export type Props = SpaceProps & {
    childrenCount: ProjectPageLayout.ChildrenCount;
    permissions: ProjectPermissions;

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
    status: Status;
    onStatusChange: (status: Status) => void;
    description: any;
    onDescriptionChange: (newDescription: any) => Promise<boolean>;

    onDelete?: () => void;

    // Tasks for this milestone
    tasks: Types.Task[];
    statusOptions: Types.Status[];

    // Optional callbacks
    onTaskCreate?: (task: Types.NewTaskPayload) => void;
    onTaskReorder?: (taskId: string, milestoneId: string | null, index: number) => void;
    onTaskAssigneeChange: (taskId: string, assignee: Person | null) => void;
    onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskStatusChange: (taskId: string, status: Types.Status | null) => void;

    assigneePersonSearch: PersonField.SearchData;

    // Filtering
    filters?: Types.FilterCondition[];
    onFiltersChange?: (filters: Types.FilterCondition[]) => void;

    // Timeline data
    timelineItems: TimelineItemType[];
    currentUser: Person;
    onAddComment: (comment: string) => void;
    onEditComment: (commentId: string, content: string) => void;
    onDeleteComment: (commentId: string) => void;
    onAddReaction?: (commentId: string, emoji: string) => void | Promise<void>;
    onRemoveReaction?: (commentId: string, reactionId: string) => void | Promise<void>;

    // Milestone metadata
    createdBy: Person | null;
    createdAt: Date;

    // Subscriptions
    subscriptions: SidebarNotificationSection.Props;

    // Rich editor support for description and comments
    richTextHandlers: RichEditorHandlers;
  };

  export type State = Props & {
    isTaskModalOpen: boolean;
    setIsTaskModalOpen: (open: boolean) => void;
    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
  };
}

function useMilestonePageState(props: MilestonePage.Props): MilestonePage.State {
  // State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return {
    ...props,
    isTaskModalOpen,
    setIsTaskModalOpen,
    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
  };
}

export function MilestonePage(props: MilestonePage.Props) {
  const state = useMilestonePageState(props);
  const {
    milestone,
    childrenCount,
    onTaskCreate,
    title,
    onMilestoneTitleChange,
    status,
    assigneePersonSearch,
    projectName,
    projectLink,
    projectStatus = "active",
    isTaskModalOpen,
    setIsTaskModalOpen,
    permissions,
  } = state;
  const handleCreateTask = (newTask: Types.NewTaskPayload) => {
    if (onTaskCreate) {
      // Add the milestone to the task
      onTaskCreate({
        ...newTask,
        milestone: milestone,
      });
    }
  };

  const tabs = useTabs(
    "tasks",
    [
      { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
      {
        id: "tasks",
        label: "Tasks",
        icon: <IconListCheck size={14} />,
        count: childrenCount.tasksCount,
      },
      { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} />, count: childrenCount.checkInsCount },
      {
        id: "discussions",
        label: "Discussions",
        icon: <IconMessages size={14} />,
        count: childrenCount.discussionsCount,
      },
      { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    ],
    { urlPath: projectLink },
  );

  const spaceProps =
    "space" in state ? { space: state.space, workmapLink: state.workmapLink } : { homeLink: state.homeLink };

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
    permissions,
    ...spaceProps,
  };

  return (
    <ProjectPageLayout {...layoutProps}>
      <MainContainer>
        <Header
          title={title}
          canEdit={permissions.canEdit}
          status={status}
          onMilestoneTitleChange={onMilestoneTitleChange}
        />

        <MobileMeta {...state} />

        <div className="sm:grid sm:grid-cols-12">
          {/* Main content - left column (8 columns) */}
          <div className="sm:col-span-8 sm:px-4 space-y-4">
            <PageDescription
              {...state}
              canEdit={permissions.canEdit}
              label="Notes"
              placeholder="Describe the milestone..."
              zeroStatePlaceholder="Add details about this milestone..."
              emptyTestId="description-section-empty"
            />

            <TasksSection {...state} />

            <TimelineSection {...state} />
          </div>

          <MilestoneSidebar {...state} />
        </div>
      </MainContainer>

      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        assigneePersonSearch={assigneePersonSearch}
        currentMilestoneId={milestone.id}
        milestones={[milestone]}
        onMilestoneSearch={async () => {}} // No-op: milestone is read-only
        milestoneReadOnly={true}
      />
      <DeleteModal {...state} />
    </ProjectPageLayout>
  );
}

function MobileMeta(props: MilestonePage.State) {
  const { status, onStatusChange, permissions, dueDate, onDueDateChange, milestone } = props;
  const isCompleted = status === "done";
  const showOverdueWarning = !isCompleted;
  const { canEdit } = permissions;

  const handleStatusToggle = () => {
    if (!canEdit) return;

    const nextStatus = isCompleted ? "pending" : "done";
    if (nextStatus === "done") {
      launchConfetti();
    }

    onStatusChange(nextStatus);
  };

  return (
    <div className="sm:hidden mt-4 mb-6" data-test-id="milestone-mobile-meta">
      <div className="flex flex-wrap gap-4">
        <SidebarSection title="Due date" className="flex-1 min-w-[160px]">
          <DateField
            date={dueDate ?? milestone.dueDate ?? null}
            onDateSelect={onDueDateChange}
            readonly={!canEdit}
            showOverdueWarning={showOverdueWarning}
            placeholder="Set due date"
            size="small"
          />
        </SidebarSection>

        <SidebarSection title="Milestone status" className="flex-1 min-w-[160px]">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <>
                  <IconFlagFilled size={16} className="text-accent-1" />
                  <span className="font-medium text-accent-1">Completed</span>
                </>
              ) : (
                <>
                  <IconFlag size={16} className="text-content-dimmed" />
                  <span className="text-content-base">Active</span>
                </>
              )}
            </div>

            {canEdit &&
              (isCompleted ? (
                <SecondaryButton size="xs" onClick={handleStatusToggle}>
                  Reopen
                </SecondaryButton>
              ) : (
                <GhostButton size="xs" icon={IconCheck} onClick={handleStatusToggle}>
                  Mark complete
                </GhostButton>
              ))}
          </div>
        </SidebarSection>
      </div>
    </div>
  );
}

function MainContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex-1 overflow-auto">
        <div className="p-4 max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  );
}

function TimelineSection(props: MilestonePage.State) {
  return (
    <div className="pt-8" data-test-id="timeline-section">
      <h3 className="font-bold mb-4">Comments & Activity</h3>
      <Timeline
        items={props.timelineItems}
        currentUser={props.currentUser}
        canComment={props.permissions.canComment}
        commentParentType="milestone"
        onAddComment={props.onAddComment}
        onEditComment={props.onEditComment}
        onDeleteComment={props.onDeleteComment}
        onAddReaction={props.onAddReaction}
        onRemoveReaction={props.onRemoveReaction}
        richTextHandlers={props.richTextHandlers}
      />
    </div>
  );
}
