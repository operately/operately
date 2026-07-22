import type { Page } from "turboui";

import type { ResourceHub, ResourceHubDocument } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

import { buildDocumentVersionsPageNavigation } from "../ResourceHubDocumentVersionsPage/navigation";

export function buildDocumentVersionComparisonPageNavigation(
  document: ResourceHubDocument,
  resourceHub: ResourceHub,
  paths: Paths,
): NonNullable<Page.Props["navigation"]> {
  return [
    ...buildDocumentVersionsPageNavigation(document, resourceHub, paths),
    {
      to: paths.resourceHubDocumentVersionsPath(document.id!),
      label: "History of changes",
    },
  ];
}
