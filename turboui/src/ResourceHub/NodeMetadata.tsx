import * as React from "react";

import { AvatarWithName, type AvatarPerson } from "../Avatar";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import classNames from "../utils/classnames";

interface NodeMetadataProps {
  author?: AvatarPerson | null;
  updatedAt?: string | null;
  details?: string[];
  formattedTimePreferences?: FormattedTimePreferences;
  textSizeClassName?: string;
}

export function NodeMetadata({
  author,
  updatedAt,
  details = [],
  formattedTimePreferences,
  textSizeClassName = "text-sm",
}: NodeMetadataProps) {
  const hasUpdatedAt = Boolean(updatedAt && formattedTimePreferences);
  const visibleDetails = details.filter(Boolean);

  if (!author && !hasUpdatedAt && visibleDetails.length < 1) return null;

  return (
    <div className={classNames("mt-0.5 flex min-w-0 items-center gap-1.5 text-content-dimmed", textSizeClassName)}>
      {author && (
        <div className="shrink-0" data-test-id="resource-hub-node-author">
          <AvatarWithName person={author} size="tiny" textSize="small" nameFormat="short" />
        </div>
      )}

      {author && hasUpdatedAt && <Separator />}

      {hasUpdatedAt && updatedAt && formattedTimePreferences && (
        <div className="shrink-0 whitespace-nowrap" data-test-id="resource-hub-node-updated-at">
          Updated <FormattedTime {...formattedTimePreferences} time={updatedAt} format="relative-time-or-date" />
        </div>
      )}

      {(author || hasUpdatedAt) && visibleDetails.length > 0 && <Separator hideOnSmallScreens />}

      {visibleDetails.length > 0 && (
        <div className="hidden min-w-0 truncate sm:block">{visibleDetails.join(" · ")}</div>
      )}
    </div>
  );
}

function Separator({ hideOnSmallScreens = false }: { hideOnSmallScreens?: boolean }) {
  return (
    <span className={classNames("shrink-0 text-content-subtle", hideOnSmallScreens && "hidden sm:inline")}>·</span>
  );
}
