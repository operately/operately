import type { Page } from "turboui";

import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubFile } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildNavigationFile(file: ResourceHubFile) {
  return buildParentAwareResource(file);
}

export function buildEditFilePageNavigation(
  file: ResourceHubFile,
  paths: Paths,
): NonNullable<Page.Props["navigation"]> {
  const items = buildResourcePageNavigationItems(buildNavigationFile(file), paths);

  return [
    ...items,
    {
      to: paths.resourceHubFilePath(file.id!),
      label: file.name || "File",
    },
  ];
}
