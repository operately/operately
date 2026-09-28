import React from "react";
import { Avatar } from "../Avatar";
import { ActionLink } from "../Link";
import { PrimaryButton, SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { FormattedTime } from "../FormattedTime";
import { TimeEntryEditor } from "./TimeEntryEditor";
import { TimeDate } from "./TimeDate";
import { formatDuration } from "./time";
import { useTimeAction } from "./useTimeAction";
import type { TimeDestination, TimeEntry, TimeTrackingData } from "./types";

export function TimeEntryList({
  entries,
  data,
  onOpenDestination,
  variant,
}: {
  entries: TimeEntry[];
  data: TimeTrackingData;
  onOpenDestination?: (destination: TimeDestination) => void;
  variant: "task" | "project";
}) {
  const [editing, setEditing] = React.useState<TimeEntry | null>(null);
  const [deleting, setDeleting] = React.useState<TimeEntry | null>(null);
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const action = useTimeAction();
  const remove = async () => {
    if (deleting && (await action.run(() => data.onDeleteEntry(deleting.id)))) setDeleting(null);
  };
  return (
    <div data-test-id="time-entry-list">
      {entries.map((entry) => (
        <div key={entry.id} className="border-t border-stroke-base py-1" data-test-id={`time-entry-${entry.id}`}>
          <div className="flex items-center gap-2">
            <Avatar person={entry.person} size="tiny" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-medium">
                {variant === "task" ? (
                  <span className="truncate" title={entry.person.fullName}>
                    {entry.person.fullName}
                  </span>
                ) : onOpenDestination && entry.destination.kind !== "project" ? (
                  <ActionLink
                    className="text-left min-w-0 truncate !text-content-base"
                    underline="hover"
                    disableColorHoverEffect
                    onClick={() => onOpenDestination(entry.destination)}
                  >
                    <span title={entry.destination.name}>{entry.destination.name}</span>
                  </ActionLink>
                ) : (
                  <span className="truncate" title={entry.destination.name}>
                    {entry.destination.name}
                  </span>
                )}
              </div>
              {variant === "project" && (
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-content-dimmed">
                  <span className="truncate">{entry.person.fullName}</span>
                  <span className="sm:hidden">
                    <TimeDate date={entry.date} preferences={data.formattedTimePreferences} />
                  </span>
                </div>
              )}
            </div>
            <span className={`text-xs text-content-dimmed shrink-0 ${variant === "project" ? "hidden sm:inline" : ""}`}>
              <TimeDate date={entry.date} preferences={data.formattedTimePreferences} />
            </span>
            <span className="font-semibold tabular-nums text-sm shrink-0 w-16 text-right">
              {formatDuration(entry.durationSeconds, data.formattedTimePreferences.locale)}
            </span>
            <Menu
              size="small"
              align="end"
              triggerLabel={`Time entry actions for ${entry.person.fullName}`}
              testId={`entry-menu-${entry.id}`}
            >
              <MenuActionItem onClick={() => setDetailsId(detailsId === entry.id ? null : entry.id)}>
                {detailsId === entry.id ? "Hide details" : "View details"}
              </MenuActionItem>
              {entry.canEdit && <MenuActionItem onClick={() => setEditing(entry)}>Edit</MenuActionItem>}
              {entry.canDelete && (
                <MenuActionItem danger onClick={() => setDeleting(entry)}>
                  Delete
                </MenuActionItem>
              )}
            </Menu>
          </div>
          {detailsId === entry.id && (
            <div className="mt-3 ml-8 rounded-lg bg-surface-dimmed p-3 text-xs text-content-dimmed space-y-1">
              {entry.notes && <p className="whitespace-pre-wrap break-words text-content-base">{entry.notes}</p>}
              <p>
                {entry.source === "timer" ? "Recorded with a timer" : "Entered manually"} · {entry.timezone}
              </p>
              {entry.startedAt && entry.endedAt && (
                <p>
                  <FormattedTime
                    time={entry.startedAt}
                    format="long-date"
                    {...data.formattedTimePreferences}
                    timezone={entry.timezone}
                  />
                  {" · "}
                  <FormattedTime
                    time={entry.startedAt}
                    format="time-only"
                    {...data.formattedTimePreferences}
                    timezone={entry.timezone}
                  />
                  {" – "}
                  <FormattedTime
                    time={entry.endedAt}
                    format="long-date"
                    {...data.formattedTimePreferences}
                    timezone={entry.timezone}
                  />
                  {" · "}
                  <FormattedTime
                    time={entry.endedAt}
                    format="time-only"
                    {...data.formattedTimePreferences}
                    timezone={entry.timezone}
                  />
                </p>
              )}
              {entry.destination.milestone && <p>Milestone: {entry.destination.milestone.name}</p>}
            </div>
          )}
        </div>
      ))}
      {editing && (
        <TimeEntryEditor
          existingEntries={data.entries.filter((entry) => entry.person.id === editing.person.id)}
          entry={editing}
          destinations={data.destinations}
          today={data.today}
          formattedTimePreferences={data.formattedTimePreferences}
          onSave={(input) => data.onSaveEntry(input, editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Modal
          isOpen
          title="Delete time entry?"
          size="small"
          closeOnBackdropClick={false}
          onClose={() => {
            if (!action.pending) setDeleting(null);
          }}
          testId="delete-time-entry-dialog"
        >
          <p className="text-sm mb-5">
            Remove {formatDuration(deleting.durationSeconds, data.formattedTimePreferences.locale)} from{" "}
            {deleting.destination.name}? Totals will update.
          </p>
          {action.error && (
            <div role="alert" className="mb-4">
              <ErrorCallout message={action.error} />
            </div>
          )}
          <div className="flex gap-2">
            <PrimaryButton size="sm" loading={action.pending} onClick={remove} testId="confirm-delete-entry">
              Delete entry
            </PrimaryButton>
            <SecondaryButton size="sm" disabled={action.pending} onClick={() => setDeleting(null)}>
              Keep entry
            </SecondaryButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
