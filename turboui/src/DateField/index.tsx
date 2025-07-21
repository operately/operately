import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { IconCalendarEvent, IconX } from "../icons";
import { InlineCalendar } from "./components/InlineCalendar";
import DateTypeSelector from "./components/DateTypeSelector";
import { MonthSelector } from "./components/MonthSelector";
import { QuarterSelector } from "./components/QuarterSelector";
import { YearSelector } from "./components/YearSelector";
import ActionButtons from "./components/ActionButtons";
import classNames from "../utils/classnames";
import { isOverdue } from "../utils/time";
import { createTestId, TestableElement } from "../TestableElement";

const DATE_TYPES = [
  { value: "day" as const, label: "Day" },
  { value: "month" as const, label: "Month" },
  { value: "quarter" as const, label: "Quarter" },
  { value: "year" as const, label: "Year" },
];

export namespace DateField {
  export interface Props extends TestableElement {
    onDateSelect?: (selectedDate: ContextualDate | null) => void;
    onCancel?: () => void;
    date?: ContextualDate | null;
    minYear?: number;
    maxYear?: number;
    placeholder?: string;
    readonly?: boolean;
    showOverdueWarning?: boolean;
    variant?: "inline" | "form-field";
    hideCalendarIcon?: boolean;
    useStartOfPeriod?: boolean;
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
  testId = "date-field",
}: DateField.Props) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateField.ContextualDate | null>(date || null);
  const [previousSelectedDate, setPreviousSelectedDate] = useState<DateField.ContextualDate | null>(date || null);
  const [dateType, setDateType] = useState<DateField.DateType>(date?.dateType || "day");

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen && selectedDate) {
      setPreviousSelectedDate(selectedDate);
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
        <div>
          <DatePickerTrigger
            selectedDate={selectedDate}
            onClick={handleTriggerClick}
            label={placeholder}
            readonly={readonly}
            showOverdueWarning={showOverdueWarning}
            variant={variant}
            hideCalendarIcon={hideCalendarIcon}
            testId={testId}
          />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="z-50 animate-fadeIn" sideOffset={5} align="start">
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
}

function DatePickerTrigger({
  selectedDate,
  label,
  onClick,
  readonly,
  showOverdueWarning,
  variant,
  hideCalendarIcon,
  testId,
}: DatePickerTriggerProps) {
  const triggerClassName = classNames(
    "inline-block focus:outline-none focus:ring-2 focus:ring-primary-base",
    variant === "inline"
      ? "rounded-lg px-1.5 py-1 -mx-1.5 -my-1"
      : "border border-surface-outline rounded-lg w-full px-2 py-1.5",
    !readonly ? "hover:bg-surface-dimmed" : "",
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  let displayText = selectedDate?.value || label;
  const isDateOverdue = selectedDate?.date && isOverdue(selectedDate.date);

  const elemClass = classNames(
    {
      "flex items-center": true,
      "gap-1.5": true,
      "text-content-error": isDateOverdue && showOverdueWarning,
      "text-content-dimmed": !selectedDate,
    },
    "text-sm",
  );

  return (
    <button
      type="button"
      className={triggerClassName}
      onClick={handleClick}
      disabled={readonly}
      aria-readonly={readonly}
      data-test-id={testId}
    >
      <span className={elemClass}>
        {!hideCalendarIcon && (
          <IconCalendarEvent
            size={16}
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
  useStartOfPeriod?: boolean;
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
  } = props;

  return (
    <div className="max-w-md min-w-[300px] p-6 bg-surface-base rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <IconCalendarEvent size={19} />
          Set Date
        </h2>
        {selectedDate && <ClearButton onClear={onClearDate} testId={testId} />}
      </div>

      <DateTypeSelector dateType={dateType} dateTypes={DATE_TYPES} setDateType={setDateType} />

      {dateType === "day" && (
        <div className="mb-3">
          <InlineCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </div>
      )}

      {dateType === "month" && (
        <MonthSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} visibleYears={yearOptions} useStartOfPeriod={props.useStartOfPeriod} />
      )}

      {dateType === "quarter" && (
        <QuarterSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} visibleYears={yearOptions} useStartOfPeriod={props.useStartOfPeriod} />
      )}

      {dateType === "year" && (
        <YearSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} years={yearOptions} useStartOfPeriod={props.useStartOfPeriod} />
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
