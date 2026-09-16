import React from "react";

import { ResourceHubDraftsPage } from "turboui";
import { getDraftEditPath, getNodePath, resourceHubLandingPath, useDeleteDocument } from "@/models/resourceHubs";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
import { buildDraftsPageNavigation } from "./navigation";

export function Page() {
  const { resourceHub, draftNodes } = useLoadedData();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();

  const mutationScope = { spaceId: resourceHub.space?.id, resourceHubId: resourceHub.id, parentFolderId: undefined };
  const { mutateAsync: deleteDocument } = useDeleteDocument(mutationScope);

  const props: ResourceHubDraftsPage.Props = {
    title: ["Drafts", resourceHub.name ?? "Docs & Files"],
    navigation: buildDraftsPageNavigation(resourceHub, paths),
    nodes: draftNodes,
    resourceHubPath: resourceHubLandingPath(paths, resourceHub),
    formattedTimePreferences,
    getNodePath: (node) =>
      resourceHub.permissions?.canEditDocument ? getDraftEditPath(paths, node) : getNodePath(paths, node),
    onDelete: resourceHub.permissions?.canDeleteDocument
      ? async (documentId) => {
          await deleteDocument({ documentId });
        }
      : undefined,
  };

  return <ResourceHubDraftsPage {...props} />;
}
