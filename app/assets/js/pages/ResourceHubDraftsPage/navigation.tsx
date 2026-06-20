import * as Paper from "@/components/PaperContainer";
import { buildDraftsPageNavigationItems, buildParentAwareResourceHub } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHub } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildNavigationResourceHub(resourceHub: ResourceHub) {
  return buildParentAwareResourceHub(resourceHub);
}

export function buildDraftsPageNavigation(resourceHub: ResourceHub, paths: Paths): Paper.NavigationItem[] {
  return buildDraftsPageNavigationItems(buildNavigationResourceHub(resourceHub), paths);
}
