import React from "react";
import { PrimaryButton } from "../Button";
import { Link } from "../Link";
import { IconPlayerPauseFilled, IconArchive } from "../icons";

export namespace StatusBanner {
  export interface Props {
    state: "paused" | "closed";
    closedAt?: Date | null;
    reopenLink?: string;
    retrospectiveLink?: string;
    entityName?: string;
  }
}

export function StatusBanner({ state, closedAt, reopenLink, retrospectiveLink, entityName = "project" }: StatusBanner.Props) {
  if (state === "paused") {
    return (
      <div data-test-id="paused-status-banner" className="bg-callout-warning-bg border-y my-2 border-surface-outline">
        <div className="flex items-center justify-center max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <IconPlayerPauseFilled className="w-5 h-5 text-content-accent" />
            <div>
              <span className="text-content-accent font-medium">This {entityName} is paused</span>
            </div>
            {reopenLink && (
              <PrimaryButton linkTo={reopenLink} size="xs">
                Resume
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "closed") {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: closedAt?.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    };

    return (
      <div data-test-id="closed-status-banner" className="bg-callout-info-bg border-y my-2 border-surface-outline">
        <div className="flex items-center justify-center max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 text-callout-info-content">
            <IconArchive className="w-5 h-5" />
            <div>
              <span>
                This {entityName} was closed on {closedAt ? formatDate(closedAt) : "an unknown date"}.
              </span>
              {retrospectiveLink && (
                <>
                  <span> Read the </span>
                  <Link to={retrospectiveLink} className="font-bold">
                    retrospective
                  </Link>
                  <span>.</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
