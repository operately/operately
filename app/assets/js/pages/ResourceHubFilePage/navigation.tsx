import type { Page } from "turboui";

import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubFile } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

function buildNavigationFile(file: ResourceHubFile) {
  return buildParentAwareResource(file);
}

export function buildFilePageNavigation(file: ResourceHubFile, paths: Paths): NonNullable<Page.Props["navigation"]> {
  return buildResourcePageNavigationItems(buildNavigationFile(file), paths);
}
