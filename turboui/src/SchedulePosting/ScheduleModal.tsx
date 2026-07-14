import { Modal } from "../Modal";
import React, { useState } from "react";
import { InlineCalendar } from "../DateField/components/InlineCalendar";
import { DateField } from "../DateField";
import { SecondaryButton, PrimaryButton } from "../Button";

export interface ScheduleModalProps {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (date: Date) => void;
  onCancel: () => void;
}

export function ScheduleModal({ children, open, onOpenChange, onSchedule, onCancel }: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<DateField.ContextualDate | null>(null);
  const [time, setTime] = useState("09:00");

  const handleSchedule = () => {
    if (selectedDate?.date) {
      const [hours = "09", minutes = "00"] = time.split(":");
      const finalDate = new Date(selectedDate.date);
      finalDate.setHours(parseInt(hours, 10));
      finalDate.setMinutes(parseInt(minutes, 10));
      onSchedule(finalDate);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const isInvalid =
    !selectedDate ||
    (() => {
      if (!selectedDate?.date) return false;
      const [hours = "09", minutes = "00"] = time.split(":");
      const finalDate = new Date(selectedDate.date);
      finalDate.setHours(parseInt(hours, 10));
      finalDate.setMinutes(parseInt(minutes, 10));
      return finalDate <= new Date();
    })();

  return (
    <>
      {children}
      <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Schedule Post" size="xx-small">
        <div className="mb-4 mt-2">
          <InlineCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            minDateLimit={startOfToday()}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <label className="text-sm font-medium text-content-dimmed">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border border-stroke-base rounded bg-surface-base px-2 py-1 text-sm focus:outline-none focus:border-brand-1"
          />
        </div>

        {isInvalid && selectedDate && (
          <div className="-mb-2 -mt-2 text-right text-xs text-red-500" role="alert">
            Time must be in the future
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

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
