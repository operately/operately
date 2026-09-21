import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Reactions } from "turboui";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function DiscussionReactions() {
  const { discussion } = useLoadedData();
  const client = useQueryClient();
  const project = discussion.project;
  assertPresent(project, "Project must be present for reactions");

  const form = useOptimisticReactions({
    entity: { id: discussion.id, type: "project_discussion" },
    initialReactions: discussion.reactions ?? undefined,
    onRefresh: () =>
      invalidateProjectInteractionQueries(client, {
        projectId: project.id,
        spaceId: discussion.space?.id ?? project.space?.id,
        resourceId: discussion.id,
        resourceType: "project_discussion",
      }),
  });

  return <Reactions {...form} size={24} canAddReaction={discussion.projectPermissions?.canComment ?? false} />;
}
