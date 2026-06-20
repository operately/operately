import * as Paper from "@/components/PaperContainer";
import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubLink } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildNavigationLink(link: ResourceHubLink) {
  return buildParentAwareResource(link);
}

export function buildEditLinkPageNavigation(link: ResourceHubLink, paths: Paths): Paper.NavigationItem[] {
  return buildResourcePageNavigationItems(buildNavigationLink(link), paths);
}
