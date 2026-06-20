import * as Paper from "@/components/PaperContainer";
import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubFile } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildNavigationFile(file: ResourceHubFile) {
  return buildParentAwareResource(file);
}

export function buildFilePageNavigation(file: ResourceHubFile, paths: Paths): Paper.NavigationItem[] {
  return buildResourcePageNavigationItems(buildNavigationFile(file), paths);
}
