import type { TFunction } from "i18next";

export const DEFAULT_RESOURCE_HUB_NAME = "Documents & Files";

export function getResourceHubDisplayName(name: string, t: TFunction): string {
  return name === DEFAULT_RESOURCE_HUB_NAME ? t("Documents & Files") : name;
}
