import React from "react";
import { type QueryClient } from "@tanstack/react-query";
import { CommentSection } from "turboui";
import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { useIsEditMode } from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function Comments() {
  const { discussion } = useLoadedData();
  const isEditMode = useIsEditMode();
  const project = discussion.project;
  assertPresent(project, "Project must be present for comments");

  const context = {
    projectId: project.id,
    spaceId: discussion.space?.id ?? project.space?.id,
    resourceId: discussion.id,
    resourceType: "project_discussion" as const,
  };
  function invalidateQueries(client: QueryClient, refetchType: "active" | "none") {
    return invalidateProjectInteractionQueries(client, context, refetchType);
  }

  const props = useCommentSection({
    entity: { id: discussion.id, type: "project_discussion" },
    mentionSearchScope: { type: "project", id: project.id },
    invalidateQueries,
    canComment: discussion.projectPermissions?.canComment ?? false,
  });

  if (isEditMode || !props) return null;

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection {...props} />
    </>
  );
}
