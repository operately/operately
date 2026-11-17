import type { Page } from "turboui";

import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubDocument } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildDocumentPageNavigation(
  document: ResourceHubDocument,
  paths: Paths,
): NonNullable<Page.Props["navigation"]> {
  return buildResourcePageNavigationItems(buildParentAwareResource(document), paths);
}
