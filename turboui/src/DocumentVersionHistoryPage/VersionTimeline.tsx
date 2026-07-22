import React from "react";

import { AvatarWithName } from "../Avatar";
import type { DocumentVersion } from "../ApiTypes";
import FormattedTime from "../FormattedTime";
import type { FormattedTimePreferences } from "../FormattedTime";
import { Link } from "../Link";
import { IconArrowRight } from "../icons";

import { eventActionText, previousVersion } from "./types";

type Props = {
  versions: DocumentVersion[];
  selectedVersionNumber: number | null;
  onSelectVersion: (versionNumber: number) => void;
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
          const person = version.editor ?? { fullName: "Former member" };
          const canCompare = version.versionNumber > 1;
          const isSelected = version.versionNumber === props.selectedVersionNumber;

          return (
            <li
              key={version.id}
              className="relative flex gap-4 pb-7 last:pb-0"
              data-test-id={`version-row-${version.versionNumber}`}
            >
              {!isLast && <span className="absolute bottom-0 left-[7px] top-3 w-px bg-stroke-base" aria-hidden />}
              <button
                type="button"
                className="absolute inset-0 z-0 cursor-pointer rounded-md"
                aria-pressed={isSelected}
                aria-label={`Preview version from ${version.insertedAt}`}
                onClick={() => props.onSelectVersion(version.versionNumber)}
                data-test-id={`select-version-${version.versionNumber}`}
              />
              <span
                className="relative z-10 mt-1 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 border-link-base bg-surface-base shadow-[0_0_0_4px_var(--color-surface-dimmed)] pointer-events-none"
                aria-hidden
                data-test-id={`version-dot-${version.versionNumber}`}
                data-selected={isSelected ? "true" : "false"}
              >
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-link-base opacity-70" />}
              </span>

              <div className="relative z-10 min-w-0 flex-1 pointer-events-none">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-bold text-content-accent">
                    <FormattedTime {...props.formattedTimePreferences} time={version.insertedAt} format="short-date" />
                    {" at "}
                    <FormattedTime {...props.formattedTimePreferences} time={version.insertedAt} format="time-only" />
                  </span>
                  {version.isCurrent && (
                    <span className="rounded-full border border-surface-outline bg-surface-base px-2 py-0.5 text-[11px] font-semibold text-content-dimmed">
                      Latest
                    </span>
                  )}
                </div>

                <div className="mt-2 text-sm leading-5 text-content-accent">
                  <AvatarWithName
                    person={person}
                    size="tiny"
                    textSize="normal"
                    nameFormat="full"
                    inline
                    className="text-sm text-content-accent"
                  />{" "}
                  {actionText}
                </div>

                {canCompare && (
                  <div className="mt-2.5 pointer-events-auto">
                    <Link
                      to={props.getComparisonPath(version.versionNumber)}
                      testId={`see-what-changed-${version.versionNumber}`}
                      underline="hover"
                      className="inline-flex items-center gap-1 text-sm font-semibold"
                    >
                      See what changed
                      <IconArrowRight size={15} stroke={2} aria-hidden />
                    </Link>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
