import React from "react";
import * as Forms from "../Forms";
import { Dropdown } from "../FormElements/Dropdown";
import { Modal } from "../Modal";
import { ViewToggle } from "../ViewToggle";
import { TimePicker } from "../TimePicker";
import { WarningCallout } from "../Callouts";
import { dateInTimezone } from "../utils/timezone";
import { format } from "date-fns";
import { clockInterval, dateKey, durationInput, parseDuration } from "./time";
import { useTimeAction } from "./useTimeAction";
import type { TimeEntryEditorProps, TimeEntryInput } from "./types";

export function TimeEntryEditor(props: TimeEntryEditorProps) {
  const action = useTimeAction();
  const [mode, setMode] = React.useState<"duration" | "clock">("duration");
  const original = props.entry ?? props.initial;
  const timezone = original?.timezone ?? props.formattedTimePreferences.timezone;
  const destinations = props.destinations.filter((destination) => destination.enabled && destination.canTrack);
  const initialDate = original?.date ?? props.today;
  const form = Forms.useForm({
    fields: {
      destinationId: props.entry?.destination.id ?? props.initial?.destinationId ?? destinations[0]?.id ?? "",
      date: initialDate,
      duration: original?.durationSeconds ? durationInput(original.durationSeconds) : "",
      notes: original?.notes ?? "",
      start: original?.startedAt ? format(dateInTimezone(new Date(original.startedAt), timezone), "HH:mm") : "09:00",
      end: original?.endedAt ? format(dateInTimezone(new Date(original.endedAt), timezone), "HH:mm") : "10:00",
      endDate: original?.endedAt ? dateKey(new Date(original.endedAt), timezone) : initialDate,
    },
    validate: (addError) => {
      if (!form.values.destinationId) addError("destinationId", "Choose a task or project.");
      if (mode === "duration" && !parseDuration(form.values.duration))
        addError("duration", "Enter a positive duration, such as 45m or 1h 30m.");
      if (mode === "clock" && !interval())
        addError("end", "Choose an end after the start and times that exist in this timezone.");
    },
    submit: async () => {
      const input = buildInput();
      if (input && (await action.run(() => props.onSave(input)))) props.onClose();
    },
    cancel: props.onClose,
  });
  function interval() {
    return clockInterval({
      date: form.values.date,
      endDate: form.values.endDate,
      start: form.values.start,
      end: form.values.end,
      timezone,
    });
  }
  function buildInput(): TimeEntryInput | null {
    const durationSeconds = parseDuration(form.values.duration);
    const timing =
      mode === "clock" ? interval() : durationSeconds ? { durationSeconds, startedAt: null, endedAt: null } : null;
    if (!timing) return null;
    const preserveTiming =
      mode === "duration" && original?.date === form.values.date && original?.durationSeconds === durationSeconds;
    return {
      destinationId: form.values.destinationId,
      date: form.values.date,
      timezone,
      notes: form.values.notes.trim(),
      ...timing,
      ...(preserveTiming ? { startedAt: original?.startedAt ?? null, endedAt: original?.endedAt ?? null } : {}),
    };
  }

  const draft = mode === "clock" ? interval() : null;
  const overlaps =
    draft &&
    props.existingEntries?.some(
      (entry) =>
        entry.id !== props.entry?.id &&
        entry.startedAt &&
        entry.endedAt &&
        new Date(entry.startedAt).getTime() < new Date(draft.endedAt).getTime() &&
        new Date(entry.endedAt).getTime() > new Date(draft.startedAt).getTime(),
    );
  const pickerValue = (value: string) => {
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    return new Date(2000, 0, 1, hours, minutes);
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!action.pending) props.onClose();
      }}
      title={props.title ?? (props.entry ? "Edit time entry" : "Log time")}
      size="medium"
      testId="time-entry-editor"
      closeOnBackdropClick={false}
    >
      <Forms.Form form={form} testId="time-entry-form">
        <fieldset disabled={action.pending} className="min-w-0 space-y-5">
          <Forms.FieldGroup>
            <Forms.InputField field="destinationId" label="Work" error={form.errors.destinationId}>
              {props.entry ? (
                <div className="text-sm py-1">
                  {props.entry.destination.scopeName} · {props.entry.destination.name}
                </div>
              ) : (
                <Dropdown
                  id="destinationId"
                  testId="time-destination"
                  value={form.values.destinationId}
                  items={destinations.map((destination) => ({
                    id: destination.id,
                    name: `${destination.scopeName} · ${destination.name}`,
                  }))}
                  onSelect={(item) => form.actions.setValue("destinationId", item.id)}
                />
              )}
            </Forms.InputField>
            <Forms.DateInput field="date" label="Date" required testId="entry-date" />
          </Forms.FieldGroup>
          <ViewToggle<"duration" | "clock">
            value={mode}
            ariaLabel="Time entry method"
            options={[
              { value: "duration", label: "Duration", onSelect: setMode },
              { value: "clock", label: "Start and end", onSelect: setMode },
            ]}
          />
          <Forms.FieldGroup>
            {mode === "duration" ? (
              <Forms.TextInput
                field="duration"
                label="Duration"
                placeholder="e.g. 1h 30m"
                autoFocus
                testId="entry-duration"
              />
            ) : (
              <>
                <Forms.InputField field="start" label={<span id="entry-start-label">Start time</span>}>
                  <TimePicker
                    id="start"
                    ariaLabelledBy="entry-start-label"
                    value={pickerValue(form.values.start)}
                    onChange={(value) => form.actions.setValue("start", value ? format(value, "HH:mm") : "")}
                    formattedTimePreferences={props.formattedTimePreferences}
                  />
                </Forms.InputField>
                <Forms.DateInput field="endDate" label="End date" required />
                <Forms.InputField
                  field="end"
                  label={<span id="entry-end-label">End time</span>}
                  error={form.errors.end}
                >
                  <TimePicker
                    id="end"
                    ariaLabelledBy="entry-end-label"
                    value={pickerValue(form.values.end)}
                    onChange={(value) => form.actions.setValue("end", value ? format(value, "HH:mm") : "")}
                    formattedTimePreferences={props.formattedTimePreferences}
                  />
                </Forms.InputField>
              </>
            )}
            <Forms.TextInput
              field="notes"
              label="Notes (optional)"
              placeholder="What did you work on?"
              testId="entry-notes"
            />
          </Forms.FieldGroup>
          {overlaps && (
            <WarningCallout
              message="This overlaps another time entry."
              description="Check the times before saving to avoid counting the same work twice."
            />
          )}
          <p className="text-xs text-content-dimmed">Time zone: {timezone}. Entries can be corrected later.</p>
          {action.error && <Forms.FormError when message={action.error} />}
          <Forms.Submit saveText={props.saveText ?? "Save entry"} testId="save-time-entry" disabled={action.pending} />
        </fieldset>
      </Forms.Form>
    </Modal>
  );
}
