import * as Paper from "@/components/PaperContainer";
import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubDocument } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

export function buildNavigationDocument(document: ResourceHubDocument) {
  return buildParentAwareResource(document);
}

export function buildEditDocumentPageNavigation(document: ResourceHubDocument, paths: Paths): Paper.NavigationItem[] {
  return buildResourcePageNavigationItems(buildNavigationDocument(document), paths);
}
