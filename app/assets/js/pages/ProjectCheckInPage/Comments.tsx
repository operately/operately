import React from "react";
import { type QueryClient } from "@tanstack/react-query";
import { CommentSection } from "turboui";
import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { useIsEditMode } from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function Comments() {
  const { checkIn } = useLoadedData();
  const isEditMode = useIsEditMode();
  const project = checkIn.project;
  assertPresent(project, "Project must be present for comments");

  const context = {
    projectId: project.id,
    spaceId: checkIn.space?.id ?? project.space?.id,
    resourceId: checkIn.id,
    resourceType: "project_check_in" as const,
  };
  function invalidateQueries(client: QueryClient, refetchType: "active" | "none") {
    return invalidateProjectInteractionQueries(client, context, refetchType);
  }

  const props = useCommentSection({
    entity: { id: checkIn.id, type: "project_check_in" },
    mentionSearchScope: { type: "project", id: project.id },
    invalidateQueries,
    canComment: project.permissions?.canComment ?? false,
    acknowledgedAt: checkIn.acknowledgedAt,
    acknowledgedBy: checkIn.acknowledgedBy,
  });

  if (isEditMode || !props) return null;

  return <CommentSection {...props} />;
}
