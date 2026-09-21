import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Reactions } from "turboui";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { useLoadedData } from "./loader";

export function RetroReactions() {
  const { retrospective } = useLoadedData();
  const client = useQueryClient();
  const project = retrospective.project;

  const form = useOptimisticReactions({
    entity: { id: retrospective.id, type: "project_retrospective" },
    initialReactions: retrospective.reactions ?? undefined,
    onRefresh: () =>
      invalidateProjectInteractionQueries(client, {
        projectId: project.id,
        spaceId: project.space?.id,
        resourceId: retrospective.id,
        resourceType: "project_retrospective",
      }),
  });

  return <Reactions {...form} size={24} canAddReaction={retrospective.permissions.canComment} />;
}
