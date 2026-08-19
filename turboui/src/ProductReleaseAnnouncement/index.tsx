import React from "react";

import { PrimaryButton } from "../Button";
import { IconSparkles, IconX } from "../icons";
import type { ProductRelease } from "./types";

export type { ProductRelease } from "./types";

export namespace ProductReleaseAnnouncement {
  export interface Props {
    release: ProductRelease;
    onDismiss: () => void;
  }
}

export function ProductReleaseAnnouncement({ release, onDismiss }: ProductReleaseAnnouncement.Props) {
  return (
    <div
      className="fixed bottom-6 right-6 z-40 w-[min(100%-2rem,24rem)]"
      role="status"
      aria-live="polite"
      data-test-id="product-release-toast"
    >
      <div className="rounded-2xl border border-surface-outline bg-surface-base shadow-xl">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-callout-info-bg text-callout-info-content">
            <IconSparkles size={18} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-content-dimmed">New release</p>
            <p className="mt-0.5 text-sm font-medium text-content-base line-clamp-3">{release.title}</p>

            <div className="mt-3">
              <PrimaryButton size="sm" linkTo={release.url} linkTarget="_blank" testId="product-release-read-more">
                Read more
              </PrimaryButton>
            </div>
          </div>

          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-content-subtle transition-colors hover:bg-surface-dimmed hover:text-content-base"
            aria-label="Dismiss"
            data-test-id="product-release-toast-dismiss"
            onClick={onDismiss}
          >
            <IconX size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
