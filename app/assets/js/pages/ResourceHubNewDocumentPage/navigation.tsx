import type { Page } from "turboui";

import { buildNewResourcePageNavigationItems, buildParentAwareResourceHub } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

function buildNavigationResourceHub(resourceHub: ResourceHub) {
  return buildParentAwareResourceHub(resourceHub);
}

export function buildNewDocumentPageNavigation(
  resourceHub: ResourceHub,
  folder: ResourceHubFolder | undefined,
  paths: Paths,
): NonNullable<Page.Props["navigation"]> {
  return buildNewResourcePageNavigationItems(buildNavigationResourceHub(resourceHub), folder, paths);
}
