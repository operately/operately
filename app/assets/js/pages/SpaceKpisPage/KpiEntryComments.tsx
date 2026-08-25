import React from "react";

import { useComments, useCommentSectionProps } from "@/features/CommentSection";
import { CommentSection } from "turboui";

interface KpiEntryCommentsProps {
  entryId: string;
  spaceId: string;
  canComment: boolean;

  // The recorded-updates log behind the panel shows each update's comment
  // count, so it has to be told when the thread grows or shrinks.
  onCommentsChanged: () => void;
}

export function KpiEntryComments({ entryId, spaceId, canComment, onCommentsChanged }: KpiEntryCommentsProps) {
  const form = useComments({
    parentType: "kpi_entry",
    kpiEntry: { id: entryId },
    space: { id: spaceId },
  });
  const comments = useCommentSectionProps({
    form,
    commentParentType: "kpi_entry",
    canComment,
  });

  if (!comments) return null;

  const addComment = async (content: unknown) => {
    const result = await comments.onAddComment(content);
    onCommentsChanged();
    return result;
  };

  const deleteComment = async (commentId: string) => {
    await comments.onDeleteComment?.(commentId);
    onCommentsChanged();
  };

  return <CommentSection {...comments} onAddComment={addComment} onDeleteComment={deleteComment} />;
}
