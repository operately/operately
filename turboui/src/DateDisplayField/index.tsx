import * as Popover from "@radix-ui/react-popover";
import { IconCalendarEvent, IconCalendarPlus, IconX } from "@tabler/icons-react";
import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";
import { SecondaryButton } from "../Button";

// Helper function to format date (matches DueDateDisplay format)
const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface DateDisplayFieldProps {
  date?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  readonly?: boolean;
  size?: "xxs" | "xs" | "sm" | "base" | "lg";
  showOverdueWarning?: boolean;
  className?: string;
}

export function DateDisplayField({
  date,
  onChange,
  placeholder = "Set date",
  readonly = false,
  size = "xs",
  showOverdueWarning = false,
  className = "",
}: DateDisplayFieldProps) {
  const isDateOverdue = date ? date < new Date() : false;

  const textColorClass = showOverdueWarning && isDateOverdue ? "text-content-error" : "text-content-base";
  const [isOpen, setIsOpen] = useState(false);

  const iconSize = 18;
  const textSize = "text-sm";

  if (readonly) {
    return date ? (
      <span className={`flex items-center gap-1.5 ${textColorClass} ${textSize} ${className}`}>
        <IconCalendarEvent size={iconSize} />
        <span>{formatDate(date)}</span>
      </span>
    ) : null;
  }

  // If editable, render as a popover with the date picker
  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Trigger date={date} className={className} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="bg-surface-base shadow-lg border border-surface-outline rounded-md p-2 z-50"
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

function Trigger({
  date,
  className,
  placeholder,
  buttonSize,
}: {
  date?: Date | null;
  className?: string;
  placeholder?: string;
  buttonSize?: "sm" | "md";
}) {
  return (
    <div className={`inline-block ${className}`}>
      {date ? (
        <div className={`flex items-center gap-1 ${textColorClass} ${textSize}`}>
          <button className="flex items-center gap-1.5 focus:outline-none hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded">
            <IconCalendarEvent size={iconSize} className="-mt-[2px]" />
            <span>{formatDate(date)}</span>
          </button>
        </div>
      ) : (
        // Show the "Set date" placeholder
        <div className="text-content-subtle">
          <SecondaryButton size={buttonSize} icon={IconCalendarPlus}>
            {placeholder}
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}

export default DateDisplayField;
