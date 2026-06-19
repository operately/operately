import * as Paper from "@/components/PaperContainer";
import { buildNewResourcePageNavigationItems, buildParentAwareResourceHub } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildNavigationResourceHub(resourceHub: ResourceHub) {
  return buildParentAwareResourceHub(resourceHub);
}

export function buildNewLinkPageNavigation(
  resourceHub: ResourceHub,
  folder: ResourceHubFolder | undefined,
  paths: Paths,
): Paper.NavigationItem[] {
  return buildNewResourcePageNavigationItems(buildNavigationResourceHub(resourceHub), folder, paths);
}
