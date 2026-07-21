import React from "react";

import { AvatarWithName } from "../Avatar";
import type { DocumentVersion } from "../ApiTypes";
import FormattedTime from "../FormattedTime";
import type { FormattedTimePreferences } from "../FormattedTime";
import { Link } from "../Link";

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
              className="relative flex gap-4 pb-8 last:pb-0"
              data-test-id={`version-row-${version.versionNumber}`}
            >
              {!isLast && <span className="absolute left-[7px] top-3 bottom-0 w-px bg-stroke-base" aria-hidden />}
              <span
                className="relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-link-base bg-surface-base"
                aria-hidden
              />

              <div className="min-w-0 flex-1">
                <div className="text-sm text-content-dimmed">
                  <FormattedTime
                    {...props.formattedTimePreferences}
                    time={version.insertedAt}
                    format="short-date"
                  />
                  {" at "}
                  <FormattedTime
                    {...props.formattedTimePreferences}
                    time={version.insertedAt}
                    format="time-only"
                  />
                  {version.isCurrent && (
                    <span className="ml-2 rounded-full bg-surface-dimmed px-2 py-0.5 text-xs font-medium text-content-dimmed">
                      Current
                    </span>
                  )}
                </div>

                <EventDescription version={version} actionText={actionText} />

                {version.origin === "migration" && (
                  <p className="mt-1 text-sm text-content-subtle">This is the earliest saved version available.</p>
                )}

                <div className="mt-2">
                  <Link
                    to={props.getComparisonPath(version.versionNumber)}
                    testId={
                      version.versionNumber <= 1
                        ? `view-version-${version.versionNumber}`
                        : `see-what-changed-${version.versionNumber}`
                    }
                    underline="always"
                  >
                    {actionLabel}
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
    return <p className="mt-1 text-base text-content-accent">{props.actionText}</p>;
  }

  const person = props.version.editor ?? { fullName: "Former member" };

  return (
    <div className="mt-1 text-base text-content-accent">
      <AvatarWithName
        person={person}
        size="tiny"
        textSize="normal"
        nameFormat="full"
        inline
        className="text-base text-content-accent"
      />{" "}
      {props.actionText}
    </div>
  );
}
