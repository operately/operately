import { Modal } from "../Modal";
import React, { useState } from "react";
import { InlineCalendar } from "../DateField/components/InlineCalendar";
import { DateField } from "../DateField";
import { SecondaryButton, PrimaryButton } from "../Button";
import type { FormattedTimePreferences } from "../FormattedTime";
import { TimePicker } from "../TimePicker";
import { dateInTimezone, zonedDateTimeToDate } from "../utils/timezone";

export interface ScheduleModalProps {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (date: Date) => void;
  onCancel: () => void;
  formattedTimePreferences: FormattedTimePreferences;
}

export function ScheduleModal({
  children,
  open,
  onOpenChange,
  onSchedule,
  onCancel,
  formattedTimePreferences,
}: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<DateField.ContextualDate | null>(null);
  const [time, setTime] = useState<Date | null>(() => defaultScheduleTime());
  const now = new Date();
  const today = dateInTimezone(now, formattedTimePreferences.timezone);

  const handleSchedule = () => {
    const finalDate = combineDateAndTime(selectedDate?.date, time, formattedTimePreferences.timezone);

    if (finalDate) {
      onSchedule(finalDate);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const scheduledDate = combineDateAndTime(selectedDate?.date, time, formattedTimePreferences.timezone);
  const isNonexistentTime = Boolean(selectedDate && time && !scheduledDate);
  const isInvalid = !scheduledDate || scheduledDate <= now;

  return (
    <>
      {children}
      <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Schedule Post" size="xx-small">
        <div className="mb-4 mt-2">
          <InlineCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            minDateLimit={startOfDay(today)}
            today={today}
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label id="schedule-time-label" className="text-sm font-medium text-content-dimmed" htmlFor="schedule-time">
            Time
          </label>
          <TimePicker
            value={time}
            onChange={setTime}
            ariaLabelledBy="schedule-time-label"
            id="schedule-time"
            wrapperClassName="ml-auto w-36"
            formattedTimePreferences={formattedTimePreferences}
          />
        </div>

        {isInvalid && selectedDate && (
          <div className="-mb-2 -mt-2 text-right text-xs text-red-500" role="alert">
            {isNonexistentTime ? "This time does not exist in your timezone" : "Time must be in the future"}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 items-center">
          <SecondaryButton onClick={handleCancel} size="sm">
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSchedule} size="sm" disabled={isInvalid}>
            Schedule
          </PrimaryButton>
        </div>
      </Modal>
    </>
  );
}

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function defaultScheduleTime(): Date {
  const time = new Date();
  time.setHours(9, 0, 0, 0);
  return time;
}

function combineDateAndTime(date: Date | undefined, time: Date | null, timezone: string): Date | null {
  if (!date || !time) return null;

  return zonedDateTimeToDate(
    {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: time.getHours(),
      minute: time.getMinutes(),
    },
    timezone,
  );
}
