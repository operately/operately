import React from "react";
import { SecondaryButton } from "../Button";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { useProjectPageTabs } from "../ProjectPageLayout/useProjectPageTabs";

import { PageHeader } from "./PageHeader";
import { Overview } from "./Overview";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { DeleteModal } from "./DeleteModal";
import { MoveModal } from "./MoveModal";
import type { TaskPage as TaskPageTypes } from "./types";

export namespace TaskPage {
  export type MoveDestinationType = TaskPageTypes.MoveDestinationType;
  export type Variant = TaskPageTypes.Variant;
  export type VariantFeatures = TaskPageTypes.VariantFeatures;
  export type MoveTaskInput = TaskPageTypes.MoveTaskInput;
  export type Space = TaskPageTypes.Space;
  export type SpaceProps = TaskPageTypes.SpaceProps;
  export type Person = TaskPageTypes.Person;
  export type Milestone = TaskPageTypes.Milestone;
  export type ReminderType = TaskPageTypes.ReminderType;
  export type Reminder = TaskPageTypes.Reminder;
  export type TimelineItemType = TaskPageTypes.TimelineItemType;
  export type Props = TaskPageTypes.Props;
  export type ContentProps = TaskPageTypes.ContentProps;
  export type ContentState = TaskPageTypes.ContentState;
  export type State = TaskPageTypes.State;
}

function useTaskPageState(props: TaskPage.Props): TaskPage.ContentState {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = React.useState(false);

  const deleteModalState = {
    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
  };

  const moveModalState = {
    isMoveModalOpen,
    openMoveModal: () => setIsMoveModalOpen(true),
    closeMoveModal: () => setIsMoveModalOpen(false),
  };

  const contentProps = {
    milestone: props.milestone,
    onMilestoneChange: props.onMilestoneChange,
    milestones: props.milestones,
    onMilestoneSearch: props.onMilestoneSearch,
    name: props.name,
    detailsLoading: props.detailsLoading,
    onNameChange: props.onNameChange,
    description: props.description,
    onDescriptionChange: props.onDescriptionChange,
    status: props.status,
    onStatusChange: props.onStatusChange,
    statusOptions: props.statusOptions,
    dueDate: props.dueDate,
    onDueDateChange: props.onDueDateChange,
    reminders: props.reminders,
    onRemindersChange: props.onRemindersChange,
    assignees: props.assignees,
    onAssigneesChange: props.onAssigneesChange,
    createdAt: props.createdAt,
    createdBy: props.createdBy,
    subscriptions: props.subscriptions,
    onDelete: props.onDelete,
    onArchive: props.onArchive,
    onMoveTask: props.onMoveTask,
    projectSearch: props.projectSearch,
    spaceSearch: props.spaceSearch,
    assigneePersonSearch: props.assigneePersonSearch,
    richTextHandlers: props.richTextHandlers,
    localDraftKeyBase: props.localDraftKeyBase,
    canEdit: props.canEdit,
    timelineItems: props.timelineItems,
    timelineIsLoading: props.timelineIsLoading,
    currentUser: props.currentUser,
    canComment: props.canComment,
    onAddComment: props.onAddComment,
    onEditComment: props.onEditComment,
    onDeleteComment: props.onDeleteComment,
    onAddReaction: props.onAddReaction,
    onRemoveReaction: props.onRemoveReaction,
    timelineFilters: props.timelineFilters,
    formattedTimePreferences: props.formattedTimePreferences,
  };

  if (props.variant === "template") {
    return {
      ...contentProps,
      variant: "template",
      dueOffsetDays: props.dueOffsetDays,
      onDueOffsetDaysChange: props.onDueOffsetDaysChange,
      ...deleteModalState,
      ...moveModalState,
    };
  }

  return {
    ...contentProps,
    variant: props.variant,
    ...deleteModalState,
    ...moveModalState,
  };
}

export function TaskPage(props: TaskPage.Props) {
  const contentState = useTaskPageState(props);

  const tabs = useProjectPageTabs({
    defaultTab: "tasks",
    childrenCount: props.childrenCount,
    showDocsAndFiles: true,
    urlPath: props.projectLink,
  });

  return (
    <ProjectPageLayout
      {...props}
      title={[props.projectName]}
      testId="project-page"
      tabs={tabs}
      status={props.projectStatus}
    >
      <div className="flex-1 overflow-auto">
        <div className="p-4 max-w-6xl mx-auto">
          <TaskContent {...contentState} />
        </div>
      </div>
    </ProjectPageLayout>
  );
}

export function TaskContent(props: TaskPage.ContentState) {
  if (props.detailsError) {
    return (
      <div className="py-12 text-sm text-content-dimmed" role="alert">
        <p>Couldn’t load task details.</p>
        {props.onRetryDetails && <SecondaryButton onClick={props.onRetryDetails} size="xs" className="mt-3">Retry</SecondaryButton>}
      </div>
    );
  }

  if (props.detailsLoading) {
    return <div className="py-12 text-sm text-content-dimmed" role="status">Loading task…</div>;
  }

  return (
    <>
      <PageHeader {...props} />
      <MobileSidebar {...props} />
      <div className="sm:grid sm:grid-cols-12 mt-6">
        <Overview {...props} />
        <Sidebar {...props} />
      </div>

      <MoveModal {...props} />
      <DeleteModal {...props} />
    </>
  );
}
