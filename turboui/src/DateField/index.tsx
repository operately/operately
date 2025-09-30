import * as Popover from "@radix-ui/react-popover";
import React, { useState } from "react";
import { match } from "ts-pattern";
import { IconCalendarEvent, IconX } from "../icons";
import { createTestId, TestableElement } from "../TestableElement";
import classNames from "../utils/classnames";
import { isOverdue } from "../utils/time";
import ActionButtons from "./components/ActionButtons";
import DateTypeSelector from "./components/DateTypeSelector";
import { InlineCalendar } from "./components/InlineCalendar";
import { MonthSelector } from "./components/MonthSelector";
import { QuarterSelector } from "./components/QuarterSelector";
import { YearSelector } from "./components/YearSelector";
import { getDateWithoutCurrentYear } from "./utils";
import { usePopoverPositioning } from "./hooks/usePopoverPositioning";
import { useEffect } from "react";

const DATE_TYPES = [
  { value: "day" as const, label: "Day" },
  { value: "month" as const, label: "Month" },
  { value: "quarter" as const, label: "Quarter" },
  { value: "year" as const, label: "Year" },
];

export { DateDisplay } from "./DateDisplay";

export namespace DateField {
  export interface Props extends TestableElement {
    onDateSelect?: (selectedDate: ContextualDate | null) => void;
    onCancel?: () => void;
    date?: ContextualDate | null;
    minYear?: number;
    maxYear?: number;
    minDateLimit?: Date;
    maxDateLimit?: Date;
    placeholder?: string;
    readonly?: boolean;
    showOverdueWarning?: boolean;
    variant?: "inline" | "form-field";
    hideCalendarIcon?: boolean;
    useStartOfPeriod?: boolean;
    size?: "std" | "small" | "lg";
    error?: boolean;
    calendarOnly?: boolean;
    ariaLabel?: string;
    className?: string;
  }

  export type DateType = "day" | "month" | "quarter" | "year";

  export interface ContextualDate {
    date: Date;
    dateType: DateType;
    value: string;
  }

  export interface DateTypeOption {
    value: DateType;
    label: string;
  }

  export interface MonthOption {
    value: string;
    label: string;
    name: string;
  }

  export interface PeriodOption {
    value: string;
    label: string;
  }
}

export function DateField({
  onDateSelect,
  onCancel,
  date,
  minYear = 2020,
  maxYear = 2030,
  placeholder = "Date",
  readonly = false,
  showOverdueWarning = false,
  variant = "inline",
  hideCalendarIcon = false,
  useStartOfPeriod = false,
  size = "std",
  testId = "date-field",
  minDateLimit,
  maxDateLimit,
  error = false,
  calendarOnly = false,
  ariaLabel,
  className = "",
}: DateField.Props) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateField.ContextualDate | null>(date || null);
  const [previousSelectedDate, setPreviousSelectedDate] = useState<DateField.ContextualDate | null>(date || null);

  // If calendarOnly is true, we only show the calendar and only "day" is accepted
  const [dateType, setDateType] = useState<DateField.DateType>(calendarOnly ? "day" : date?.dateType || "day");

  const { useSidePositioning, triggerRef, side } = usePopoverPositioning({ open });

  useEffect(() => {
    setSelectedDate(date || null);
    setPreviousSelectedDate(date || null);
    setDateType(calendarOnly ? "day" : date?.dateType || "day");
  }, [date]);

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen && selectedDate) {
      setPreviousSelectedDate(selectedDate);
    } else if (!isOpen && selectedDate) {
      // When closing the popover with a selected date, behave like clicking "Confirm"
      onDateSelect?.(selectedDate);
    }
  };

  const handleTriggerClick = () => {
    if (readonly) return;

    setOpen(!open);

    if (!open) {
      setPreviousSelectedDate(selectedDate);
    }
  };

  const handleCancel = () => {
    setSelectedDate(previousSelectedDate);
    setOpen(false);
    onCancel?.();
  };

  const handleDateSelect = () => {
    setOpen(false);

    if (selectedDate) {
      onDateSelect?.(selectedDate);
    } else {
      onDateSelect?.(null);
    }
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setPreviousSelectedDate(null);
    onDateSelect?.(null);
    setDateType("day");
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild disabled={readonly}>
        <div ref={triggerRef}>
          <DatePickerTrigger
            selectedDate={selectedDate}
            label={placeholder}
            onClick={handleTriggerClick}
            readonly={readonly}
            showOverdueWarning={showOverdueWarning}
            variant={variant}
            hideCalendarIcon={hideCalendarIcon}
            testId={testId}
            size={size}
            error={error}
            ariaLabel={ariaLabel}
            className={className}
          />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 animate-fadeIn max-h-[80vh] overflow-y-auto"
          sideOffset={6}
          align={useSidePositioning ? "center" : "start"}
          collisionPadding={8}
          avoidCollisions={true}
          side={side}
          sticky="always"
        >
          <DatePickerContent
            dateType={dateType}
            setDateType={setDateType}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onDateSelect={handleDateSelect}
            onCancel={handleCancel}
            onClearDate={handleClearDate}
            yearOptions={yearOptions}
            testId={testId}
            useStartOfPeriod={useStartOfPeriod}
            minDateLimit={minDateLimit}
            maxDateLimit={maxDateLimit}
            calendarOnly={calendarOnly}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface DatePickerTriggerProps extends TestableElement {
  selectedDate: DateField.ContextualDate | null;
  label: string;
  onClick: () => void;
  readonly: boolean;
  showOverdueWarning: boolean;
  variant: "inline" | "form-field";
  hideCalendarIcon: boolean;
  size: "std" | "small" | "lg";
  error: boolean;
  ariaLabel?: string;
  className?: string;
}

function DatePickerTrigger({
  selectedDate,
  label,
  onClick,
  readonly,
  showOverdueWarning,
  variant,
  hideCalendarIcon,
  size,
  testId,
  error,
  ariaLabel,
  className = "",
}: DatePickerTriggerProps) {
  let displayText = selectedDate ? getDateWithoutCurrentYear(selectedDate) : label;
  const isDateOverdue = selectedDate?.date && isOverdue(selectedDate.date);

  const fieldSize = match(size)
    .with("std", () => `border ${error ? "border-red-500" : "border-surface-outline"} rounded-lg w-full px-2 py-1.5`)
    .with("small", () => `border ${error ? "border-red-500" : "border-surface-outline"} rounded-lg w-full px-1.5 py-1`)
    .with("lg", () => `border ${error ? "border-red-500" : "border-surface-outline"} rounded-lg w-full px-2.5 py-2`)
    .exhaustive();

  const elementSize = match(size)
    .with("std", () => "text-sm gap-1.5")
    .with("small", () => "text-xs gap-1")
    .with("lg", () => "text-base gap-2")
    .exhaustive();

  const elemClass = classNames(
    "flex items-center",
    {
      "text-content-error": isDateOverdue && showOverdueWarning,
      "text-content-dimmed": !selectedDate,
    },
    elementSize,
  );

  const triggerClassName = classNames(
    "inline-block focus:outline-none focus:ring-2 focus:ring-primary-base",
    variant === "inline" ? `rounded-lg px-1.5 py-1 -mx-1.5 -my-1 ${error ? "border border-red-500" : ""}` : fieldSize,
    !readonly ? "hover:bg-surface-dimmed" : "",
    className,
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  return (
    <button
      type="button"
      className={triggerClassName}
      onClick={handleClick}
      disabled={readonly}
      aria-readonly={readonly}
      aria-label={ariaLabel}
      data-test-id={testId}
    >
      <span className={elemClass}>
        {!hideCalendarIcon && (
          <IconCalendarEvent
            size={match(size)
              .with("small", () => 12)
              .with("std", () => 16)
              .with("lg", () => 18)
              .exhaustive()}
            className={isDateOverdue && showOverdueWarning ? "text-content-error -mt-[1px]" : "-mt-[1px]"}
          />
        )}
        <span className="truncate">{displayText}</span>
      </span>
    </button>
  );
}

interface DatePickerContentProps {
  dateType: DateField.DateType;
  setDateType: React.Dispatch<React.SetStateAction<DateField.DateType>>;
  selectedDate: DateField.ContextualDate | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<DateField.ContextualDate | null>>;
  onDateSelect?: (selectedDate: DateField.ContextualDate | null) => void;
  onCancel?: () => void;
  onClearDate?: () => void;
  yearOptions: number[];
  testId: string;
  useStartOfPeriod: boolean;
  minDateLimit?: Date;
  maxDateLimit?: Date;
  calendarOnly: boolean;
}

function DatePickerContent(props: DatePickerContentProps) {
  const {
    dateType,
    setDateType,
    selectedDate,
    setSelectedDate,
    onDateSelect,
    onCancel,
    onClearDate,
    yearOptions,
    testId,
    minDateLimit,
    maxDateLimit,
    useStartOfPeriod,
    calendarOnly,
  } = props;

  return (
    <div className="max-w-md min-w-[300px] p-6 bg-surface-base rounded-lg border border-stroke-base">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <IconCalendarEvent size={19} />
          Set Date
        </h2>
        {selectedDate && <ClearButton onClear={onClearDate} testId={testId} />}
      </div>

      {!calendarOnly && <DateTypeSelector dateType={dateType} dateTypes={DATE_TYPES} setDateType={setDateType} />}

      {dateType === "day" && (
        <div className="mb-3">
          <InlineCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            minDateLimit={minDateLimit}
            maxDateLimit={maxDateLimit}
          />
        </div>
      )}

      {dateType === "month" && (
        <MonthSelector
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          visibleYears={yearOptions}
          useStartOfPeriod={useStartOfPeriod}
          minDateLimit={minDateLimit}
          maxDateLimit={maxDateLimit}
        />
      )}

      {dateType === "quarter" && (
        <QuarterSelector
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          visibleYears={yearOptions}
          useStartOfPeriod={useStartOfPeriod}
          minDateLimit={minDateLimit}
          maxDateLimit={maxDateLimit}
        />
      )}

      {dateType === "year" && (
        <YearSelector
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          years={yearOptions}
          useStartOfPeriod={useStartOfPeriod}
          minDateLimit={minDateLimit}
          maxDateLimit={maxDateLimit}
        />
      )}

      <ActionButtons selectedDate={selectedDate} onCancel={onCancel} onSetDeadline={onDateSelect} />
    </div>
  );
}

function ClearButton({ onClear, testId }: { onClear?: () => void; testId: string }) {
  return (
    <button
      onClick={() => onClear?.()}
      className="flex items-center text-xs text-content-subtle px-2 py-1 rounded hover:bg-surface-dimmed"
      data-test-id={createTestId(testId, "clear")}
    >
      <IconX size={14} className="mr-1" />
      Clear
    </button>
  );
}
