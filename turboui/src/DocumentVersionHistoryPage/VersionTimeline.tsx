import React from "react";

import { AvatarWithName } from "../Avatar";
import type { DocumentVersion } from "../ApiTypes";
import FormattedTime from "../FormattedTime";
import type { FormattedTimePreferences } from "../FormattedTime";
import { Link } from "../Link";
import { IconArrowRight } from "../icons";

import { eventActionLabel, eventActionText, previousVersion } from "./types";

type Props = {
  versions: DocumentVersion[];
  formattedTimePreferences: FormattedTimePreferences;
  getComparisonPath: (versionNumber: number) => string;
};

export function VersionTimeline(props: Props) {
  return (
    <nav aria-label="Version history" className="relative" data-test-id="version-timeline">
      <ol className="relative m-0 list-none space-y-0 p-0">
        {props.versions.map((version, index) => {
          const isLast = index === props.versions.length - 1;
          const previous = previousVersion(props.versions, version);
          const actionText = eventActionText(version, previous);
          const actionLabel = eventActionLabel(version);

          return (
            <li
              key={version.id}
              className="relative flex gap-4 pb-7 last:pb-0"
              data-test-id={`version-row-${version.versionNumber}`}
            >
              {!isLast && <span className="absolute bottom-0 left-[7px] top-3 w-px bg-stroke-base" aria-hidden />}
              <span
                className="relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-link-base bg-surface-base shadow-[0_0_0_4px_var(--color-surface-dimmed)]"
                aria-hidden
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-bold text-content-accent">Version {version.versionNumber}</span>
                  {version.isCurrent && (
                    <span className="rounded-full border border-surface-outline bg-surface-base px-2 py-0.5 text-[11px] font-semibold text-content-dimmed">
                      Current
                    </span>
                  )}
                </div>

                <div className="mt-1 text-xs text-content-subtle">
                  <FormattedTime {...props.formattedTimePreferences} time={version.insertedAt} format="short-date" />
                  {" at "}
                  <FormattedTime {...props.formattedTimePreferences} time={version.insertedAt} format="time-only" />
                </div>

                <EventDescription version={version} actionText={actionText} />

                {version.origin === "migration" && (
                  <p className="mt-1 text-sm text-content-subtle">This is the earliest saved version available.</p>
                )}

                <div className="mt-2.5">
                  <Link
                    to={props.getComparisonPath(version.versionNumber)}
                    testId={
                      version.versionNumber <= 1
                        ? `view-version-${version.versionNumber}`
                        : `see-what-changed-${version.versionNumber}`
                    }
                    underline="hover"
                    className="inline-flex items-center gap-1 text-sm font-semibold"
                  >
                    {actionLabel}
                    <IconArrowRight size={15} stroke={2} aria-hidden />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function EventDescription(props: { version: DocumentVersion; actionText: string }) {
  if (props.version.origin === "migration") {
    return <p className="mt-2 text-sm leading-5 text-content-accent">{props.actionText}</p>;
  }

  const person = props.version.editor ?? { fullName: "Former member" };

  return (
    <div className="mt-2 text-sm leading-5 text-content-accent">
      <AvatarWithName
        person={person}
        size="tiny"
        textSize="normal"
        nameFormat="full"
        inline
        className="text-sm text-content-accent"
      />{" "}
      {props.actionText}
    </div>
  );
}
