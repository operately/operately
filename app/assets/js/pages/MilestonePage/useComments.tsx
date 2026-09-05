import React from "react";

import * as Milestones from "@/models/milestones";
import * as Comments from "@/models/comments";
import * as Reactions from "@/models/reactions";

import { Paths } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { showErrorToast } from "turboui";

export function useComments(paths: Paths, milestone: Milestones.Milestone, refreshPageData: () => Promise<void>) {
  const me = useMe()!;
  const createMilestoneComment = Milestones.useCreateMilestoneComment();

  const [comments, setComments] = React.useState(
    Milestones.parseMilestoneCommentsForTurboUi(paths, milestone.comments),
  );

  React.useEffect(() => {
    setComments(Milestones.parseMilestoneCommentsForTurboUi(paths, milestone.comments));
  }, [milestone.comments, paths]);

  const { handleAddReaction, handleRemoveReaction } = Reactions.useReactionHandlers(setComments, "milestone", () => {
    void refreshPageData();
  });

  const { handleEditComment } = Comments.useEditCommentHandler(comments, setComments, "milestone", () => {
    void refreshPageData();
  });

  const { handleDeleteComment } = Comments.useDeleteCommentHandler(comments, setComments, "milestone", () => {
    void refreshPageData();
  });

  const handleCreateComment = React.useCallback(
    async (content: any) => {
      const tempId = `temp-${Math.random().toString(36).substring(2, 15)}`;

      try {
        const optimisticComment: Milestones.MilestoneComment = {
          __typename: "milestone_comment",
          action: "none",
          comment: {
            __typename: "comment",
            id: tempId,
            insertedAt: new Date().toISOString(),
            content: Comments.stringifyCommentContent(content),
            author: me,
            reactions: [],
          },
        };

        setComments((prev) => [...prev, Milestones.parseMilestoneCommentForTurboUi(paths, optimisticComment)]);

        const res = await createMilestoneComment.mutateAsync({
          milestoneId: milestone.id!,
          action: "none",
          content: Comments.stringifyCommentContent(content),
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
          await refreshPageData();
          return true;
        }
        return false;
      } catch (error) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        showErrorToast("Error", "Failed to add comment.");
        return false;
      }
    },
    [createMilestoneComment, paths, me, milestone.id, refreshPageData],
  );

  return {
    comments,
    setComments,
    handleCreateComment,
    handleEditComment,
    handleDeleteComment,
    handleAddReaction,
    handleRemoveReaction,
  };
}
