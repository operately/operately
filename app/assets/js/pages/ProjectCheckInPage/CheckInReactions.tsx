import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Reactions } from "turboui";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { invalidateProjectInteractionQueries } from "@/models/projects/projectInteractionQueries";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function CheckInReactions() {
  const { checkIn } = useLoadedData();
  const client = useQueryClient();
  const project = checkIn.project;
  assertPresent(project, "Project must be present for reactions");

  const form = useOptimisticReactions({
    entity: { id: checkIn.id, type: "project_check_in" },
    initialReactions: checkIn.reactions ?? undefined,
    onRefresh: () =>
      invalidateProjectInteractionQueries(client, {
        projectId: project.id,
        spaceId: checkIn.space?.id ?? project.space?.id,
        resourceId: checkIn.id,
        resourceType: "project_check_in",
      }),
  });

  return <Reactions {...form} size={24} canAddReaction={project.permissions?.canComment ?? false} />;
}
