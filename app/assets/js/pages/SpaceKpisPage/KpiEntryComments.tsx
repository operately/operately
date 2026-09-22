import React from "react";

import { useCommentSection } from "@/features/CommentSection";
import { invalidateKpiCommentQueries } from "@/models/kpis/kpiCommentQueries";
import { type QueryClient } from "@tanstack/react-query";
import { CommentSection } from "turboui";

interface KpiEntryCommentsProps {
  entryId: string;
  kpiId: string;
  spaceId: string;
  canComment: boolean;
}

export function KpiEntryComments({ entryId, kpiId, spaceId, canComment }: KpiEntryCommentsProps) {
  function invalidateQueries(client: QueryClient, refetchType: "active" | "none") {
    return invalidateKpiCommentQueries(client, { entryId, kpiId, spaceId }, refetchType);
  }

  const comments = useCommentSection({
    entity: { id: entryId, type: "kpi_entry" },
    mentionSearchScope: { type: "space", id: spaceId },
    invalidateQueries,
    canComment,
  });

  if (!comments) return null;

  return <CommentSection {...comments} />;
}
