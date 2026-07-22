import type { Page } from "turboui";

import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubLink } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildNavigationLink(link: ResourceHubLink) {
  return buildParentAwareResource(link);
}

export function buildLinkPageNavigation(link: ResourceHubLink, paths: Paths): NonNullable<Page.Props["navigation"]> {
  return buildResourcePageNavigationItems(buildNavigationLink(link), paths);
}
