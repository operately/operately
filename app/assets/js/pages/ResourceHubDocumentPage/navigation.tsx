import * as Paper from "@/components/PaperContainer";
import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHub, ResourceHubDocument } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

export function buildNavigationDocument(document: ResourceHubDocument, resourceHub: ResourceHub) {
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

export function buildDocumentPageNavigation(
  document: ResourceHubDocument,
  resourceHub: ResourceHub,
  paths: Paths,
): Paper.NavigationItem[] {
  return buildResourcePageNavigationItems(buildNavigationDocument(document, resourceHub), paths);
}
