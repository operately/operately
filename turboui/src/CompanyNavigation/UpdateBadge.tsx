import React from "react";

import { DivLink } from "../Link";
import { PRODUCT_RELEASES_PAGE_URL } from "../ProductReleaseAnnouncement";
import classNames from "../utils/classnames";
import { CompanyNavigationUpdate } from "./types";

// Compact "New" pill, in the spirit of Notion/GitHub status chips and Linear's
// announcement chip: a live dot and a short label. The badge carries its own
// left margin so the navbar does not keep a gap when no update is available.
const badgeClassName = classNames(
  "ml-2.5 inline-flex items-center gap-1",
  "rounded-full px-2 py-0.5",
  "text-[11px] font-medium leading-none whitespace-nowrap",
  "bg-brand-1/10 text-brand-1",
  "ring-1 ring-inset ring-brand-1/20",
  "hover:bg-brand-1/15 hover:ring-brand-1/35",
  "dark:bg-brand-1/20 dark:ring-brand-1/30 dark:hover:bg-brand-1/30",
  "transition-colors cursor-pointer",
);

export function UpdateBadge({ update }: { update?: CompanyNavigationUpdate | null }) {
  if (!update) return null;

  const href = update.link ?? PRODUCT_RELEASES_PAGE_URL;

  return (
    <DivLink
      to={href}
      target="_blank"
      external={href.startsWith("http")}
      className={badgeClassName}
      title={`Operately ${update.version} is available. This instance is running an older version.`}
      testId="update-available-badge"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-1" aria-hidden="true" />
      <span>New</span>
      <span className="font-semibold">{update.version}</span>
    </DivLink>
  );
}
