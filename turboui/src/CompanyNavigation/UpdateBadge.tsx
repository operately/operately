import React from "react";
import { Trans, useTranslation } from "react-i18next";

import { DivLink } from "../Link";
import { translationText } from "../i18n";
import { PRODUCT_RELEASES_PAGE_URL } from "../ProductReleaseAnnouncement";
import classNames from "../utils/classnames";
import { CompanyNavigationUpdate } from "./types";

const badgeClassName = classNames(
  "ml-2.5 inline-flex shrink-0 items-center gap-1.5",
  "rounded-md py-1 pl-1 pr-2",
  "text-xs font-medium leading-none whitespace-nowrap",
  "bg-callout-info-bg text-callout-info-content",
  "ring-1 ring-inset ring-brand-1/20",
  "hover:bg-blue-100 hover:ring-brand-1/35",
  "dark:ring-brand-1/40 dark:hover:bg-blue-800",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-1",
  "cursor-pointer",
);

export function UpdateBadge({ update }: { update?: CompanyNavigationUpdate | null }) {
  const { t } = useTranslation();

  if (!update) return null;

  const href = update.link ?? PRODUCT_RELEASES_PAGE_URL;

  return (
    <DivLink
      to={href}
      target="_blank"
      external={href.startsWith("http")}
      className={badgeClassName}
      title={translationText(
        t(
          "Operately {{version}} is available. This instance is running an older version. View release notes.",
          { version: update.version },
        ),
      )}
      testId="update-available-badge"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-callout-info-content" aria-hidden="true" />
      <span>
        <Trans
          i18nKey="<version>{{version}}</version> available"
          values={{ version: update.version }}
          components={{ version: <span className="font-semibold tabular-nums" /> }}
        />
      </span>
    </DivLink>
  );
}
