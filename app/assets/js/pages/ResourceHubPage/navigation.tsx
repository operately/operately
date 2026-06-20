import * as Paper from "@/components/PaperContainer";
import { buildParentAwareResourceHub, buildResourceHubPageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHub } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

function buildNavigationResourceHub(resourceHub: ResourceHub) {
  return buildParentAwareResourceHub(resourceHub);
}

export function buildResourceHubPageNavigation(resourceHub: ResourceHub, paths: Paths): Paper.NavigationItem[] {
  return buildResourceHubPageNavigationItems(buildNavigationResourceHub(resourceHub), paths);
}
