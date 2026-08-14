import React, { useMemo } from "react";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import { AcknowledgmentFeedRow, MilestoneCompletedFeedRow, MilestoneReopenedFeedRow } from "./FeedRows";
import type { CommentFormState, CommentSectionItem, CommentSectionProps } from "./types";

export function CommentSection({
  items,
  currentUser,
  canComment,
  submitting = false,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddReaction,
  onRemoveReaction,
  richTextHandlers,
  formattedTimePreferences,
  commentParentType = "comment",
  commentDraftKey,
  editCommentDraftKey,
  commentNotificationInfo,
  ackLabel = "Check-In",
  onCommentVisible,
  canManageComments = false,
}: CommentSectionProps) {
  const form = useMemo<CommentFormState>(
    () => ({
      items: [],
      submitting,
      postComment: onAddComment,
      editComment: onEditComment,
      deleteComment: onDeleteComment,
      commentDraftKey,
      editCommentDraftKey:
        editCommentDraftKey ||
        ((commentId: string) => (commentDraftKey ? `${commentDraftKey}:edit-comment:${commentId}` : undefined)),
    }),
    [submitting, onAddComment, onEditComment, onDeleteComment, commentDraftKey, editCommentDraftKey],
  );

  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <CommentSectionRow
          key={commentSectionItemKey(item, index)}
          item={item}
          form={form}
          currentUserId={currentUser.id}
          canComment={canComment}
          commentParentType={commentParentType}
          richTextHandlers={richTextHandlers}
          formattedTimePreferences={formattedTimePreferences}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
          onCommentVisible={onCommentVisible}
          ackLabel={ackLabel}
          canManageComments={canManageComments}
        />
      ))}

      {canComment && (
        <CommentInput
          form={form}
          currentUser={currentUser}
          richTextHandlers={richTextHandlers}
          notificationInfo={commentNotificationInfo}
        />
      )}
    </div>
  );
}

function CommentSectionRow({
  item,
  form,
  currentUserId,
  canComment,
  commentParentType,
  richTextHandlers,
  formattedTimePreferences,
  onAddReaction,
  onRemoveReaction,
  onCommentVisible,
  ackLabel,
  canManageComments,
}: {
  item: CommentSectionItem;
  form: CommentFormState;
  currentUserId: string;
  canComment: boolean;
  commentParentType: string;
  richTextHandlers: CommentSectionProps["richTextHandlers"];
  formattedTimePreferences: CommentSectionProps["formattedTimePreferences"];
  onAddReaction?: CommentSectionProps["onAddReaction"];
  onRemoveReaction?: CommentSectionProps["onRemoveReaction"];
  onCommentVisible?: CommentSectionProps["onCommentVisible"];
  ackLabel: string;
  canManageComments?: boolean;
}) {
  switch (item.type) {
    case "comment":
      return (
        <CommentItem
          comment={item.value}
          form={form}
          commentParentType={commentParentType}
          canComment={canComment}
          currentUserId={currentUserId}
          richTextHandlers={richTextHandlers}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
          formattedTimePreferences={formattedTimePreferences}
          appearance="flat"
          onVisible={onCommentVisible}
          canManageComments={canManageComments}
        />
      );

    case "milestone-completed":
      return <MilestoneCompletedFeedRow activity={item.value} formattedTimePreferences={formattedTimePreferences} />;

    case "milestone-reopened":
      return <MilestoneReopenedFeedRow activity={item.value} formattedTimePreferences={formattedTimePreferences} />;

    case "acknowledgment":
      return (
        <AcknowledgmentFeedRow
          person={item.value}
          ackAt={item.insertedAt}
          label={ackLabel}
          formattedTimePreferences={formattedTimePreferences}
        />
      );
  }
}

function commentSectionItemKey(item: CommentSectionItem, index: number): string {
  if (item.type === "acknowledgment") {
    return `acknowledgment-${item.insertedAt}`;
  }

  if (item.value?.id) {
    return `${item.type}-${item.value.id}`;
  }

  return `${item.type}-${index}`;
}
