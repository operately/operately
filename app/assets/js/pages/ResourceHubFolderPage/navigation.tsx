import * as Paper from "@/components/PaperContainer";
import { buildFolderPageNavigationItems, buildParentAwareResource } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubFolder } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildNavigationFolder(folder: ResourceHubFolder) {
  return buildParentAwareResource(folder);
}

export function buildFolderPageNavigation(folder: ResourceHubFolder, paths: Paths): Paper.NavigationItem[] {
  return buildFolderPageNavigationItems(buildNavigationFolder(folder), paths);
}
