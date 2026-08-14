import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { IconSparkles, IconX } from "../icons";
import { Modal } from "../Modal";
import { truncateReleaseParagraphs } from "./truncateReleaseParagraphs";
import type { ProductRelease } from "./types";

export type { ProductRelease } from "./types";
export { truncateReleaseParagraphs } from "./truncateReleaseParagraphs";

export namespace ProductReleaseAnnouncement {
  export interface Props {
    release: ProductRelease;
    onDismiss: () => void;
    formattedTimePreferences: FormattedTimePreferences;
    defaultModalOpen?: boolean;
  }
}

export function ProductReleaseAnnouncement({
  release,
  onDismiss,
  formattedTimePreferences,
  defaultModalOpen = false,
}: ProductReleaseAnnouncement.Props) {
  const [isModalOpen, setIsModalOpen] = React.useState(defaultModalOpen);
  const { shown, truncated } = truncateReleaseParagraphs(release.paragraphs);
  const teaser = release.teaser ?? release.paragraphs[0] ?? "";

  const closeModal = () => setIsModalOpen(false);

  const dismiss = () => {
    setIsModalOpen(false);
    onDismiss();
  };

  return (
    <>
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
              <p className="text-sm font-semibold text-content-accent">New release</p>
              <p className="mt-0.5 text-sm font-medium text-content-base line-clamp-2">{release.title}</p>
              {teaser ? <p className="mt-1 text-xs text-content-dimmed line-clamp-2">{teaser}</p> : null}

              <div className="mt-3">
                <PrimaryButton size="sm" onClick={() => setIsModalOpen(true)} testId="product-release-read-more">
                  Read more
                </PrimaryButton>
              </div>
            </div>

            <button
              type="button"
              className="shrink-0 rounded-md p-1 text-content-subtle transition-colors hover:bg-surface-dimmed hover:text-content-base"
              aria-label="Dismiss"
              data-test-id="product-release-toast-dismiss"
              onClick={dismiss}
            >
              <IconX size={16} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={release.title}
        size="medium"
        testId="product-release-modal"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-content-dimmed">
            <FormattedTime time={release.publishedAt} format="long-date" {...formattedTimePreferences} />
          </p>

          <div className="relative">
            <div className="space-y-3 text-sm leading-6 text-content-base">
              {shown.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            {truncated ? (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-base to-transparent"
                aria-hidden="true"
              />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <SecondaryButton size="sm" onClick={dismiss} testId="product-release-modal-dismiss">
              Dismiss
            </SecondaryButton>
            <PrimaryButton size="sm" linkTo={release.url} linkTarget="_blank" testId="product-release-full-post">
              Read the full post
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
