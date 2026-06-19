import React from "react";

import { ResourceHubDraftsPage } from "turboui";
import { getNodePath } from "@/models/resourceHubs";

import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
import { buildDraftsPageNavigation } from "./navigation";

export function Page() {
  const { resourceHub, draftNodes } = useLoadedData();
  const paths = usePaths();

  const props: ResourceHubDraftsPage.Props = {
    title: ["Drafts", resourceHub.name ?? "Resource Hub"],
    navigation: buildDraftsPageNavigation(resourceHub, paths),
    nodes: draftNodes,
    getNodePath: (node) => getNodePath(paths, node),
  };

  return <ResourceHubDraftsPage {...props} />;
}
