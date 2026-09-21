import React from "react";
import { type QueryClient } from "@tanstack/react-query";
import { CommentSection } from "turboui";
import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { useIsEditMode } from "@/components/Pages";
import { useLoadedData } from "./loader";

export function Comments() {
  const { retrospective } = useLoadedData();
  const isEditMode = useIsEditMode();
  const project = retrospective.project;

  const context = {
    projectId: project.id,
    spaceId: project.space?.id,
    resourceId: retrospective.id,
    resourceType: "project_retrospective" as const,
  };
  function invalidateQueries(client: QueryClient, refetchType: "active" | "none") {
    return invalidateProjectInteractionQueries(client, context, refetchType);
  }

  const props = useCommentSection({
    entity: { id: retrospective.id, type: "project_retrospective" },
    mentionSearchScope: { type: "project", id: project.id },
    invalidateQueries,
    canComment: retrospective.permissions.canComment,
    acknowledgedAt: retrospective.acknowledgedAt,
    acknowledgedBy: retrospective.acknowledgedBy,
    ackLabel: "Retrospective",
  });

  if (isEditMode || !props) return null;

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection {...props} />
    </>
  );
}
