import React from "react";

import { DivLink } from "../Link";
import { PRODUCT_RELEASES_PAGE_URL } from "../ProductReleaseAnnouncement";
import classNames from "../utils/classnames";
import { CompanyNavigationUpdate } from "./types";

// The badge carries its own left margin so the navbar does not keep the gap when no
// update is available.
const badgeClassName = classNames(
  "ml-3 flex items-center whitespace-nowrap",
  "rounded-full px-2 py-0.5",
  "text-xs font-bold",
  "bg-callout-info-bg text-callout-info-content",
  "hover:bg-callout-info-content hover:text-callout-info-bg",
  "transition-colors cursor-pointer",
);

export function UpdateBadge({ update }: { update?: CompanyNavigationUpdate | null }) {
  if (!update) return null;

  const text = update.phrasing === "available" ? `${update.version} available` : `Update to ${update.version}`;

  return (
    <DivLink
      to={update.link ?? PRODUCT_RELEASES_PAGE_URL}
      target="_blank"
      className={badgeClassName}
      title={`Operately ${update.version} is available. This instance is running an older version.`}
      testId="update-available-badge"
    >
      {text}
    </DivLink>
  );
}
