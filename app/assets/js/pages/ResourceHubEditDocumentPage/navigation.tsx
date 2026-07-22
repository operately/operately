import type { Page } from "turboui";

import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubDocument } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

function buildNavigationDocument(document: ResourceHubDocument) {
  return buildParentAwareResource(document);
}

export function buildEditDocumentPageNavigation(
  document: ResourceHubDocument,
  paths: Paths,
): NonNullable<Page.Props["navigation"]> {
  const items = buildResourcePageNavigationItems(buildNavigationDocument(document), paths);

  return [
    ...items,
    {
      to: paths.resourceHubDocumentPath(document.id!),
      label: document.name || "Document",
    },
  ];
}
