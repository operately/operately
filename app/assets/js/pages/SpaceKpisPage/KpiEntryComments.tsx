import React from "react";

import { useComments, useCommentSectionProps } from "@/features/CommentSection";
import { CommentSection } from "turboui";

interface KpiEntryCommentsProps {
  entryId: string;
  spaceId: string;
  canComment: boolean;
}

export function KpiEntryComments({ entryId, spaceId, canComment }: KpiEntryCommentsProps) {
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

  return <CommentSection {...comments} />;
}
