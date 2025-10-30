import React from "react";

import Api from "@/api";
import * as Tasks from "@/models/tasks";
import * as Comments from "@/models/comments";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { showErrorToast } from "turboui";
import { compareIds } from "@/routes/paths";

export function useComments(task: Tasks.Task, initialComments: Comments.Comment[], invalidateCache: () => void) {
  const currentUser = useMe();
  const [comments, setComments] = React.useState(initialComments);

  React.useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const updateCommentById = React.useCallback(
    (commentId: string, updater: (comment: Comments.Comment) => Comments.Comment) => {
      setComments((prev) => prev.map((comment) => (compareIds(comment.id, commentId) ? updater(comment) : comment)));
    },
    [setComments],
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

  const handleEditComment = React.useCallback(
    async (commentId: string, content: any) => {
      const comment = comments.find((c) => compareIds(c.id, commentId));

      try {
        if (comment) {
          setComments((prev) =>
            prev.map((c) =>
              compareIds(c.id, commentId) ? { ...c, content: JSON.stringify({ message: content }) } : c,
            ),
          );
        }

        await Api.editComment({ commentId, parentType: "project_task", content: JSON.stringify(content) });

        invalidateCache();
      } catch (error) {
        setComments((prev) => prev.map((c) => (compareIds(c.id, commentId) ? { ...c, content: comment?.content } : c)));
        showErrorToast("Error", "Failed to edit comment.");
      }
    },
    [comments, invalidateCache],
  );

  const handleAddReaction = React.useCallback(
    async (commentId: string, emoji: string) => {
      if (!currentUser) {
        showErrorToast("Error", "Failed to add reaction.");
        return;
      }

      const tempReactionId = `temp-${Date.now()}`;
      const optimisticReaction = {
        id: tempReactionId,
        emoji,
        person: currentUser,
      };

      // Optimistically add reaction
      updateCommentById(commentId, (comment) => ({
        ...comment,
        reactions: [...(comment.reactions ?? []), optimisticReaction],
      }));

      try {
        await Api.addReaction({
          entityId: commentId,
          entityType: "comment",
          parentType: "project_task",
          emoji,
        });

        invalidateCache();
      } catch (error) {
        // Rollback on error
        updateCommentById(commentId, (comment) => ({
          ...comment,
          reactions: (comment.reactions ?? []).filter((reaction) => reaction.id !== tempReactionId),
        }));
        showErrorToast("Error", "Failed to add reaction.");
      }
    },
    [currentUser, updateCommentById, invalidateCache],
  );

  const handleRemoveReaction = React.useCallback(
    async (commentId: string, reactionId: string) => {
      let removedReaction: any = null;

      // Optimistically remove reaction
      updateCommentById(commentId, (comment) => {
        const reactions = comment.reactions ?? [];
        removedReaction = reactions.find((r) => r.id === reactionId);
        return { ...comment, reactions: reactions.filter((r) => r.id !== reactionId) };
      });

      try {
        await Api.removeReaction({ reactionId });
        invalidateCache();
      } catch (error) {
        // Rollback on error
        if (removedReaction) {
          updateCommentById(commentId, (comment) => ({
            ...comment,
            reactions: [...(comment.reactions ?? []), removedReaction],
          }));
        }

        showErrorToast("Error", "Failed to remove reaction.");
      }
    },
    [updateCommentById, invalidateCache],
  );

  return {
    comments,
    handleAddComment,
    handleEditComment,
    handleAddReaction,
    handleRemoveReaction,
  };
}
