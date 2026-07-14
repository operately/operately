import * as Popover from "@radix-ui/react-popover";
import React from "react";

import { IconChevronDown, IconClock } from "../icons";
import type { FormattedTimePreferences } from "../FormattedTime";
import classNames from "../utils/classnames";
import { formatTime } from "../utils/formatting";

export interface TimePickerProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  ariaLabelledBy?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  formattedTimePreferences: Pick<FormattedTimePreferences, "locale" | "timeFormat">;
}

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

export function TimePicker({
  value,
  onChange,
  ariaLabelledBy,
  disabled = false,
  id,
  placeholder = "Select time",
  className = "",
  wrapperClassName = "w-full",
  formattedTimePreferences,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hour = value?.getHours() ?? 9;
  const minute = value?.getMinutes() ?? 0;
  const displayValue = value
    ? formatTime(value, formattedTimePreferences.locale, formattedTimePreferences.timeFormat)
    : placeholder;

  const selectTime = (nextHour: number, nextMinute: number) => {
    const nextValue = value ? new Date(value) : new Date();
    nextValue.setHours(nextHour, nextMinute, 0, 0);
    onChange(nextValue);
  };

  return (
    <div className={wrapperClassName}>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabelledBy ? undefined : displayValue}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={classNames(
              "flex w-full cursor-pointer items-center gap-2 rounded-lg border border-surface-outline bg-surface-base px-2.5 py-1.5 text-left text-sm text-content-base outline-none transition",
              "hover:border-brand-1 hover:bg-surface-dimmed focus-visible:border-brand-1 focus-visible:ring-2 focus-visible:ring-brand-1/30",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-surface-outline disabled:hover:bg-surface-base",
              className,
            )}
          >
            <IconClock aria-hidden="true" size={16} className="shrink-0 text-content-dimmed" />
            <span className={classNames("min-w-0 flex-1 truncate", !value && "text-content-dimmed")}>
              {displayValue}
            </span>
            <IconChevronDown
              aria-hidden="true"
              size={15}
              className={classNames("shrink-0 text-content-subtle transition-transform", isOpen && "rotate-180")}
            />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            role="dialog"
            aria-label="Select time"
            side="top"
            align="end"
            sideOffset={8}
            collisionPadding={12}
            className="z-[100] w-48 overflow-hidden rounded-lg border border-stroke-base bg-surface-base text-content-base shadow-xl"
          >
            <div className="border-b border-stroke-base bg-surface-base px-3 py-2.5">
              <h3 className="text-sm font-semibold">Select time</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-surface-base p-2">
              <TimeOptions
                label="Hour"
                options={HOURS}
                selectedValue={hour}
                formatOption={formatTwoDigitTimePart}
                onSelect={(nextHour) => selectTime(nextHour, minute)}
              />
              <TimeOptions
                label="Minute"
                options={MINUTES}
                selectedValue={minute}
                formatOption={formatTwoDigitTimePart}
                onSelect={(nextMinute) => selectTime(hour, nextMinute)}
              />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

interface TimeOptionsProps {
  label: string;
  options: number[];
  selectedValue: number;
  formatOption: (value: number) => string;
  onSelect: (value: number) => void;
}

function TimeOptions({ label, options, selectedValue, formatOption, onSelect }: TimeOptionsProps) {
  const selectedOptionRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    selectedOptionRef.current?.scrollIntoView?.({ block: "center" });
  }, []);

  return (
    <div role="group" aria-label={label} className="min-w-0">
      <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-content-dimmed">{label}</div>
      <div className="max-h-44 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
        {options.map((option) => {
          const isSelected = option === selectedValue;
          const optionLabel = formatOption(option);

          return (
            <button
              key={optionLabel}
              ref={isSelected ? selectedOptionRef : undefined}
              type="button"
              aria-pressed={isSelected}
              className={classNames(
                "w-full cursor-pointer rounded-md px-2 py-1.5 text-center text-sm outline-none transition-colors",
                "hover:bg-surface-dimmed focus-visible:ring-2 focus-visible:ring-brand-1/40",
                isSelected && "bg-brand-1/10 font-semibold text-brand-1 ring-1 ring-inset ring-brand-1/20",
              )}
              onClick={() => onSelect(option)}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatTwoDigitTimePart(value: number): string {
  return String(value).padStart(2, "0");
}
