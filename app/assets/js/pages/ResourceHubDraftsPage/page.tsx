import React from "react";

import { ResourceHubDraftsPage } from "turboui";
import { getNodePath } from "@/models/resourceHubs";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";

export function Page() {
  const { resourceHub, draftNodes } = useLoadedData();
  const paths = usePaths();
  assertPresent(resourceHub.space, "space must be present in resourceHub");

  const props: ResourceHubDraftsPage.Props = {
    title: ["Drafts", resourceHub.name ?? "Resource Hub"],
    navigation: [
      { to: paths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! },
      { to: paths.resourceHubPath(resourceHub.id!), label: resourceHub.name ?? "Resource Hub" },
    ],
    nodes: draftNodes,
    getNodePath: (node) => getNodePath(paths, node),
  };

  return <ResourceHubDraftsPage {...props} />;
}
