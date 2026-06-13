import React from "react";

import { ResourceHubDraftsPage, resourceHubDraftsNavigation } from "turboui";
import { getNodePath, resourceHubNavigationPaths } from "@/models/resourceHubs";

import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";

export function Page() {
  const { resourceHub, draftNodes } = useLoadedData();
  const paths = usePaths();

  const props: ResourceHubDraftsPage.Props = {
    title: ["Drafts", resourceHub.name ?? "Resource Hub"],
    navigation: resourceHubDraftsNavigation(resourceHub, resourceHubNavigationPaths(paths)),
    nodes: draftNodes,
    getNodePath: (node) => getNodePath(paths, node),
  };

  return <ResourceHubDraftsPage {...props} />;
}
