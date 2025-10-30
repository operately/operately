import React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { showErrorToast } from "turboui";
import { compareIds } from "@/routes/paths";

export function useComments(paths: Paths, milestone: Milestones.Milestone, invalidateCache: () => void) {
  const me = useMe()!;

  const [comments, setComments] = React.useState(
    Milestones.parseMilestoneCommentsForTurboUi(paths, milestone.comments),
  );

  const updateCommentById = React.useCallback(
    (commentId: string, updater: (comment: any) => any) => {
      setComments((prev) =>
        prev.map((comment) => {
          if ("content" in comment && compareIds(comment.id, commentId)) {
            return updater(comment);
          }
          return comment;
        }),
      );
    },
    [setComments],
  );

  const handleCreateComment = React.useCallback(
    async (content: any) => {
      const tempId = `temp-${Math.random().toString(36).substring(2, 15)}`;

      try {
        const optimisticComment: Milestones.MilestoneComment = {
          action: "none",
          comment: {
            id: tempId,
            insertedAt: new Date().toISOString(),
            content: JSON.stringify({ message: content }),
            author: me,
            reactions: [],
          },
        };

        setComments((prev) => [...prev, Milestones.parseMilestoneCommentForTurboUi(paths, optimisticComment)]);

        const res = await Api.postMilestoneComment({
          milestoneId: milestone.id!,
          action: "none",
          content: JSON.stringify(content),
        });

        if (res.comment) {
          setComments((prev) => {
            return prev.map((c) => {
              if (c.id === tempId) {
                const comment = { ...res.comment.comment, author: me };
                return Milestones.parseMilestoneCommentForTurboUi(paths, { ...res.comment, comment });
              } else {
                return c;
              }
            });
          });
          invalidateCache();
        }
      } catch (error) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        showErrorToast("Error", "Failed to add comment.");
      }
    },
    [paths, me, milestone.id],
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

        await Api.editComment({
          commentId,
          parentType: "milestone",
          content: JSON.stringify(content),
        });

        invalidateCache();
      } catch (error) {
        if (comment) {
          setComments((prev) => prev.map((c) => (compareIds(c.id, commentId) ? { ...comment } : c)));
        }
        showErrorToast("Error", "Failed to edit comment.");
      }
    },
    [comments, invalidateCache],
  );

  const handleAddReaction = React.useCallback(
    async (commentId: string, emoji: string) => {
      const parsedPerson = People.parsePersonForTurboUi(paths, me);

      if (!parsedPerson) {
        showErrorToast("Error", "Failed to add reaction.");
        return;
      }

      const tempReactionId = `temp-${Date.now()}`;
      const optimisticReaction = { id: tempReactionId, emoji, person: parsedPerson };

      // Optimistically add reaction
      updateCommentById(commentId, (comment: any) => ({
        ...comment,
        reactions: [...(comment.reactions ?? []), optimisticReaction],
      }));

      try {
        await Api.addReaction({
          entityId: commentId,
          entityType: "comment",
          parentType: "milestone",
          emoji,
        });

        invalidateCache();
      } catch (error) {
        // Rollback on error
        updateCommentById(commentId, (comment: any) => ({
          ...comment,
          reactions: (comment.reactions ?? []).filter((reaction: any) => reaction.id !== tempReactionId),
        }));

        showErrorToast("Error", "Failed to add reaction.");
      }
    },
    [paths, me, updateCommentById, invalidateCache],
  );

  const handleRemoveReaction = React.useCallback(
    async (commentId: string, reactionId: string) => {
      let removedReaction: any = null;

      // Optimistically remove reaction
      updateCommentById(commentId, (comment: any) => {
        const reactions = comment.reactions ?? [];
        removedReaction = reactions.find((r: any) => r.id === reactionId);
        return { ...comment, reactions: reactions.filter((r: any) => r.id !== reactionId) };
      });

      try {
        await Api.removeReaction({ reactionId });
        invalidateCache();
      } catch (error) {
        // Rollback on error
        if (removedReaction) {
          updateCommentById(commentId, (comment: any) => ({
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
    setComments,
    handleCreateComment,
    handleEditComment,
    handleAddReaction,
    handleRemoveReaction,
  };
}
