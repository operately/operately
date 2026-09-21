import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Activity, CommentThread, Project } from "@/api";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { Reactions } from "turboui";
import { useLoadedData } from "./loader";

export function ActivityReactions() {
  const { activity, project } = useLoadedData();
  const { commentThread, permissions } = activity;

  if (!commentThread?.reactions || !permissions) return null;

  return <ThreadReactions activity={activity} project={project} thread={commentThread} />;
}

function ThreadReactions({
  activity,
  project,
  thread,
}: {
  activity: Activity;
  project: Project;
  thread: CommentThread;
}) {
  const client = useQueryClient();
  const form = useOptimisticReactions({
    entity: { id: thread.id, type: "project_discussion" },
    initialReactions: thread.reactions ?? undefined,
    onRefresh: () =>
      invalidateProjectInteractionQueries(client, {
        projectId: project.id,
        spaceId: project.space?.id,
        resourceId: thread.id,
        resourceType: "project_discussion",
        activityId: activity.id,
      }),
  });

  return <Reactions {...form} size={24} canAddReaction={activity.permissions?.canCommentOnThread ?? false} />;
}
