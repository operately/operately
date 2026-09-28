import React from "react";
import { SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { ActionLink } from "../Link";
import { TimeTrackingControls } from "./TimerControls";
import { TimeEntryList } from "./TimeEntryList";
import { formatDuration } from "./time";
import { useTimeAction } from "./useTimeAction";
import type { TaskTimeSectionProps } from "./types";

export function TaskTimeSection(props: TaskTimeSectionProps) {
  const [expanded, setExpanded] = React.useState(false);
  const action = useTimeAction();
  const entries = props.entries
    .filter(
      (entry) =>
        entry.destination.id === props.destination.id &&
        (props.canViewTeam || entry.person.id === props.currentPersonId),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const visibleEntries = expanded ? entries : entries.slice(0, 3);
  const ownEntries = entries.filter((entry) => entry.person.id === props.currentPersonId);
  const total = (values: typeof entries) =>
    formatDuration(
      values.reduce((sum, entry) => sum + entry.durationSeconds, 0),
      props.formattedTimePreferences.locale,
    );
  const running = props.activeTimer?.destination.id === props.destination.id ? props.activeTimer : null;
  return (
    <section className="space-y-3" data-test-id="task-time-section">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="font-bold">Time</h3>
        <TimeTrackingControls data={props} destination={props.destination} closed={props.isTaskClosed} compact />
      </div>
      {!props.destination.enabled && <p className="text-sm text-content-dimmed">Time tracking is off.</p>}
      {props.isTaskClosed && running && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-content-dimmed">
          <p>Task completed. Your timer is still running.</p>
          <SecondaryButton
            size="xs"
            loading={action.pending}
            onClick={() => action.run(() => props.onStopTimer(running.id))}
          >
            Stop timer
          </SecondaryButton>
        </div>
      )}
      {action.error && (
        <div role="alert">
          <ErrorCallout message={action.error} />
        </div>
      )}
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
      ) : (
        <>
          {entries.length ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <p className="text-content-dimmed">
                  <span className="font-semibold text-content-base tabular-nums" data-test-id="task-own-time">
                    {total(ownEntries)}
                  </span>{" "}
                  yours
                  {props.canViewTeam && (
                    <>
                      <span className="mx-2" aria-hidden>
                        ·
                      </span>
                      <span className="font-semibold text-content-base tabular-nums" data-test-id="task-team-time">
                        {total(entries)}
                      </span>{" "}
                      team total
                    </>
                  )}
                </p>
              </div>
              <TimeEntryList entries={visibleEntries} data={props} variant="task" />
              {entries.length > 3 && (
                <ActionLink
                  className="text-sm"
                  underline="hover"
                  aria-expanded={expanded}
                  testId="toggle-older-time-entries"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Show less" : "Show older entries"}
                </ActionLink>
              )}
            </>
          ) : (
            <p className="text-sm text-content-dimmed">No time recorded yet.</p>
          )}
        </>
      )}
    </section>
  );
}
