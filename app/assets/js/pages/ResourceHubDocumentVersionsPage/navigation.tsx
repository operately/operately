import type { Page } from "turboui";

import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHub, ResourceHubDocument } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

function buildNavigationDocument(document: ResourceHubDocument, resourceHub: ResourceHub) {
  assertPresent(document.resourceHub, "resourceHub must be present in document");

  return buildParentAwareResource({
    ...document,
    resourceHub: {
      ...document.resourceHub,
      potentialSubscribers: resourceHub.potentialSubscribers,
      permissions: resourceHub.permissions,
    },
  });
}

export function buildDocumentVersionsPageNavigation(
  document: ResourceHubDocument,
  resourceHub: ResourceHub,
  paths: Paths,
): NonNullable<Page.Props["navigation"]> {
  const items = buildResourcePageNavigationItems(buildNavigationDocument(document, resourceHub), paths);

  return [
    ...items,
    {
      to: paths.resourceHubDocumentPath(document.id!),
      label: document.name || "Document",
    },
  ];
}
