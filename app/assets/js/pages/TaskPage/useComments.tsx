import React from "react";

import Api from "@/api";
import * as Tasks from "@/models/tasks";
import * as Comments from "@/models/comments";
import * as Reactions from "@/models/reactions";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { showErrorToast, CommentSubscribersSelector } from "turboui";
import { useNotificationRecipientsAdapter } from "@/models/subscriptions";

export function useComments(task: Tasks.Task, initialComments: Comments.Comment[], invalidateCache: () => void) {
  const currentUser = useMe();
  const [comments, setComments] = React.useState(initialComments);

  const notificationRecipients = useNotificationRecipientsAdapter(task.potentialSubscribers ?? [], {
    ignoreMe: true,
    initialSubscriptions: task.subscriptionList?.subscriptions ?? [],
  });

  React.useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const { handleAddReaction, handleRemoveReaction } = Reactions.useReactionHandlers(
    setComments,
    "project_task",
    invalidateCache,
  );

  const { handleEditComment } = Comments.useEditCommentHandler(comments, setComments, "project_task", invalidateCache);

  const { handleDeleteComment } = Comments.useDeleteCommentHandler(
    comments,
    setComments,
    "project_task",
    invalidateCache,
  );

  const handleAddComment = React.useCallback(
    async (content: any) => {
      const randomId = `temp-${Math.random().toString(36).substring(2, 15)}`;

      try {
        const optimisticComment: Comments.Comment = {
          id: randomId,
          author: currentUser,
          content: JSON.stringify({ message: content }),
          insertedAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
          reactions: [],
        };

        setComments((prevComments) => [optimisticComment, ...prevComments]);

        const res = await Api.createComment({
          entityId: task.id,
          entityType: "project_task",
          content: JSON.stringify(content),
        });

        if (res.comment) {
          setComments((prev) =>
            prev.map((c) => (c.id === randomId ? { ...c, id: res.comment.id, insertedAt: res.comment.insertedAt } : c)),
          );
          invalidateCache();
        }
      } catch (error) {
        setComments((prev) => prev.filter((c) => c.id !== randomId));
        showErrorToast("Error", "Failed to add comment.");
      }
    },
    [task.id, currentUser, invalidateCache],
  );

  const commentNotificationSelector = React.useMemo<CommentSubscribersSelector.Props>(
    () => ({
      subscribers: notificationRecipients.subscribers,
      selectedSubscriberIds: notificationRecipients.selectedSubscriberIds,
      onSelectedSubscriberIdsChange: notificationRecipients.onSelectedSubscriberIdsChange,
      alwaysNotify: notificationRecipients.alwaysNotify,
    }),
    [
      notificationRecipients.subscribers,
      notificationRecipients.selectedSubscriberIds,
      notificationRecipients.onSelectedSubscriberIdsChange,
      notificationRecipients.alwaysNotify,
    ],
  );

  return {
    comments,
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
    handleAddReaction,
    handleRemoveReaction,
    commentNotificationSelector,
  };
}
