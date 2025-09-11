import React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";

import { Paths } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentCompanyContext";

export function useComments(paths: Paths, milestone: Milestones.Milestone, invalidateCache: () => void) {
  const me = useMe()!;

  const [comments, setComments] = React.useState(
    Milestones.parseMilestoneCommentsForTurboUi(paths, milestone.comments),
  );

  const handleCreateComment = React.useCallback(async (content: any) => {
    const tempId = `temp-${Date.now()}`;
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
  }, [paths, me, milestone.id]);

  return { comments, setComments, handleCreateComment };
}
