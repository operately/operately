import React from "react";
import { SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { ActionLink } from "../Link";
import { TimeTrackingControls } from "./TimerControls";
import { TimeEntryList } from "./TimeEntryList";
import { formatDuration } from "./time";
import type { ProjectTimeSectionProps } from "./types";

export function ProjectTimeSection(props: ProjectTimeSectionProps) {
  const [expanded, setExpanded] = React.useState(false);
  const entries = props.entries
    .filter(
      (entry) =>
        entry.destination.scopeId === props.projectDestination.scopeId &&
        (props.canViewTeam || entry.person.id === props.currentPersonId),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = entries.reduce((sum, entry) => sum + entry.durationSeconds, 0);

  return (
    <section className="space-y-3" data-test-id="project-time-section">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-bold">Time</h3>
        <TimeTrackingControls data={props} destination={props.projectDestination} compact showTimer={false} />
      </div>
      {!props.projectDestination.enabled && <p className="text-sm text-content-dimmed">Time tracking is off.</p>}
      {props.loading ? (
        <p role="status" className="text-sm text-content-dimmed">
          Loading time entries…
        </p>
      ) : props.error ? (
        <div role="alert" className="space-y-2">
          <ErrorCallout message={props.error} />
          {props.onRetry && (
            <SecondaryButton size="xs" onClick={props.onRetry}>
              Try again
            </SecondaryButton>
          )}
        </div>
      ) : entries.length ? (
        <>
          <p className="text-sm text-content-dimmed">
            <span className="font-semibold text-content-base tabular-nums" data-test-id="project-time-total">
              {formatDuration(total, props.formattedTimePreferences.locale)}
            </span>{" "}
            {props.canViewTeam ? "total across this project" : "recorded by you"}
          </p>
          <TimeEntryList
            entries={expanded ? entries : entries.slice(0, 3)}
            data={props}
            variant="project"
            onOpenDestination={props.onOpenDestination}
          />
          {entries.length > 3 && (
            <ActionLink
              className="text-sm"
              underline="hover"
              aria-expanded={expanded}
              testId="toggle-older-project-time-entries"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : "Show older entries"}
            </ActionLink>
          )}
        </>
      ) : (
        <p className="text-sm text-content-dimmed">
          {props.canViewTeam ? "No time recorded yet." : "You haven't recorded time on this project yet."}
        </p>
      )}
    </section>
  );
}
