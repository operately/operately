import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";
import * as Popover from "@radix-ui/react-popover";
import { IconCalendarEvent, IconCalendarPlus, IconX } from "@tabler/icons-react";
import { SecondaryButton } from "../Button";

import "react-datepicker/dist/react-datepicker.css";

// Helper function to format date (matches DueDateDisplay format)
const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface DateDisplayFieldProps {
  date?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  isEditable?: boolean;
  size?: "xxs" | "xs" | "sm" | "base" | "lg";
  showOverdueWarning?: boolean;
  className?: string;
}

export function DateDisplayField({
  date,
  onChange,
  placeholder = "Set date",
  isEditable = true,
  size = "xs",
  showOverdueWarning = false,
  className = "",
}: DateDisplayFieldProps) {
  // Use the same overdue check logic as DueDateDisplay
  const isDateOverdue = date ? date < new Date() : false;
  // Only apply red color if showOverdueWarning is true AND the date is actually overdue
  const textColorClass = showOverdueWarning && isDateOverdue ? "text-content-error" : "text-content-dimmed";
  const [isOpen, setIsOpen] = useState(false);

  // If not editable, render a simple read-only display
  if (!isEditable) {
    return date ? (
      <span className={`text-xs flex items-center gap-1 ${textColorClass} ${className}`}>
        <IconCalendarEvent size={14} />
        <span>{formatDate(date)}</span>
      </span>
    ) : null;
  }

  // If editable, render as a popover with the date picker
  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <div className={`inline-block ${className}`}>
          {date ? (
            // Show the set date with calendar icon
            <div className={`flex items-center gap-1 ${textColorClass}`}>
              <button className="flex items-center gap-1 hover:underline focus:outline-none text-xs">
                <IconCalendarEvent size={14} />
                <span>{formatDate(date)}</span>
              </button>
            </div>
          ) : (
            // Show the "Set date" placeholder
            <div className="text-content-subtle">
              <SecondaryButton size={size} icon={IconCalendarPlus}>
                {placeholder}
              </SecondaryButton>
            </div>
          )}
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-surface-default shadow-lg border border-surface-outline rounded-md p-2 z-50"
          sideOffset={5}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Select date</div>
            {date && (
              <button
                onClick={() => {
                  onChange && onChange(null);
                  setIsOpen(false);
                }}
                className="flex items-center text-xs text-content-subtle px-2 py-1 rounded hover:bg-surface-hover"
              >
                <IconX size={14} className="mr-1" />
                Clear
              </button>
            )}
          </div>
          <ReactDatePicker selected={date || undefined} onChange={(date) => onChange && onChange(date)} inline />
          <Popover.Arrow className="fill-surface-default" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default DateDisplayField;
