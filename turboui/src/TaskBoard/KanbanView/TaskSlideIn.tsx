import React from "react";
import { SlideIn } from "../../SlideIn";
import { TaskPage } from "../../TaskPage";
import { TaskContent } from "../../TaskPage";

interface TaskSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  taskPageProps: TaskPage.Props | null;
}

export function TaskSlideIn({
  isOpen,
  onClose,
  taskPageProps,
}: TaskSlideInProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  if (!taskPageProps) return null;

  const state: TaskPage.ContentState = {
    milestone: taskPageProps.milestone,
    onMilestoneChange: taskPageProps.onMilestoneChange,
    milestones: taskPageProps.milestones,
    onMilestoneSearch: taskPageProps.onMilestoneSearch,
    name: taskPageProps.name,
    onNameChange: taskPageProps.onNameChange,
    description: taskPageProps.description,
    onDescriptionChange: taskPageProps.onDescriptionChange,
    status: taskPageProps.status,
    onStatusChange: taskPageProps.onStatusChange,
    statusOptions: taskPageProps.statusOptions,
    dueDate: taskPageProps.dueDate,
    onDueDateChange: taskPageProps.onDueDateChange,
    assignee: taskPageProps.assignee,
    onAssigneeChange: taskPageProps.onAssigneeChange,
    createdAt: taskPageProps.createdAt,
    createdBy: taskPageProps.createdBy,
    subscriptions: taskPageProps.subscriptions,
    onDelete: taskPageProps.onDelete,
    onArchive: taskPageProps.onArchive,
    assigneePersonSearch: taskPageProps.assigneePersonSearch,
    richTextHandlers: taskPageProps.richTextHandlers,
    canEdit: taskPageProps.canEdit,
    timelineItems: taskPageProps.timelineItems,
    currentUser: taskPageProps.currentUser,
    canComment: taskPageProps.canComment,
    onAddComment: taskPageProps.onAddComment,
    onEditComment: taskPageProps.onEditComment,
    onDeleteComment: taskPageProps.onDeleteComment,
    onAddReaction: taskPageProps.onAddReaction,
    onRemoveReaction: taskPageProps.onRemoveReaction,
    timelineFilters: taskPageProps.timelineFilters,
    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
  };

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} width="70%" testId="task-slide-in">
      <div className="p-4">
        <TaskContent {...state} />
      </div>
    </SlideIn>
  );
}

