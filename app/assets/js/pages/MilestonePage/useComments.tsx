import React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as Comments from "@/models/comments";
import * as Reactions from "@/models/reactions";

import { Paths } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { showErrorToast } from "turboui";

export function useComments(paths: Paths, milestone: Milestones.Milestone, invalidateCache: () => void) {
  const me = useMe()!;

  const [comments, setComments] = React.useState(
    Milestones.parseMilestoneCommentsForTurboUi(paths, milestone.comments),
  );

  const { handleAddReaction, handleRemoveReaction } = Reactions.useReactionHandlers(
    setComments,
    "milestone",
    invalidateCache,
  );

  const { handleEditComment } = Comments.useEditCommentHandler(
    comments,
    setComments,
    "milestone",
    invalidateCache,
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


  return {
    comments,
    setComments,
    handleCreateComment,
    handleEditComment,
    handleAddReaction,
    handleRemoveReaction,
  };
}
