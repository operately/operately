import React from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { Activity, CommentThread, Project } from "@/api";
import { CommentSection } from "turboui";
import { useIsEditMode } from "@/components/Pages";
import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { useLoadedData } from "./loader";

export function Comments() {
  const { activity, project } = useLoadedData();
  if (!activity.commentThread || !activity.permissions) return null;

  return <ActivityComments activity={activity} project={project} thread={activity.commentThread} />;
}

function ActivityComments({
  activity,
  project,
  thread,
}: {
  activity: Activity;
  project: Project;
  thread: CommentThread;
}) {
  const isEditMode = useIsEditMode();
  const context = {
    projectId: project.id,
    spaceId: project.space?.id,
    resourceId: thread.id,
    resourceType: "project_discussion" as const,
    activityId: activity.id,
  };
  function invalidateQueries(client: QueryClient, refetchType: "active" | "none") {
    return invalidateProjectInteractionQueries(client, context, refetchType);
  }

  const props = useCommentSection({
    entity: { id: thread.id, type: "project_discussion" },
    mentionSearchScope: { type: "project", id: project.id },
    invalidateQueries,
    canComment: activity.permissions?.canCommentOnThread ?? false,
  });

  if (isEditMode || !props) return null;

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection {...props} />
    </>
  );
}
