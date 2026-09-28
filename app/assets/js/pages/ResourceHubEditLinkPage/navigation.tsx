import type { Page } from "turboui";
import i18n from "@/i18n";

import { buildParentAwareResource, buildResourcePageNavigationItems } from "@/models/resourceHubs/pageNavigation";
import type { ResourceHubLink } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";

function buildNavigationLink(link: ResourceHubLink) {
  return buildParentAwareResource(link);
}

export function buildEditLinkPageNavigation(
  link: ResourceHubLink,
  paths: Paths,
): NonNullable<Page.Props["navigation"]> {
  const items = buildResourcePageNavigationItems(buildNavigationLink(link), paths);

  return [
    ...items,
    {
      to: paths.resourceHubLinkPath(link.id!),
      label: link.name || i18n.t("Link"),
    },
  ];
}
