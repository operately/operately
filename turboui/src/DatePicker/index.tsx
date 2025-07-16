import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { IconCalendar, IconChevronDown } from "../icons";
import { InlineCalendar } from "./components/InlineCalendar";
import DateTypeSelector from "./components/DateTypeSelector";
import { MonthSelector } from "./components/MonthSelector";
import { QuarterSelector } from "./components/QuarterSelector";
import { YearSelector } from "./components/YearSelector";
import ActionButtons from "./components/ActionButtons";
import classNames from "../utils/classnames";
import { isOverdue } from "../utils/time";

const DATE_TYPES = [
  { value: "day" as const, label: "Day" },
  { value: "month" as const, label: "Month" },
  { value: "quarter" as const, label: "Quarter" },
  { value: "year" as const, label: "Year" },
];

export namespace DatePicker {
  export interface Props {
    onDateSelect?: (selectedDate: ContextualDate | undefined) => void;
    onCancel?: () => void;
    initialDate?: ContextualDate;
    minYear?: number;
    maxYear?: number;
    triggerLabel?: string;
    readonly?: boolean;
    showOverdueWarning?: boolean;
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

export function DatePicker({
  onDateSelect,
  onCancel,
  initialDate,
  minYear = 2020,
  maxYear = 2030,
  triggerLabel = "Date",
  readonly = false,
  showOverdueWarning = false,
}: DatePicker.Props) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DatePicker.ContextualDate | undefined>(initialDate);
  const [previousSelectedDate, setPreviousSelectedDate] = useState<DatePicker.ContextualDate | undefined>(initialDate);
  const [dateType, setDateType] = useState<DatePicker.DateType>(initialDate?.dateType || "day");

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
      onDateSelect?.(undefined);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild disabled={readonly}>
        <div>
          <DatePickerTrigger
            selectedDate={selectedDate}
            onClick={handleTriggerClick}
            label={triggerLabel}
            readonly={readonly}
            showOverdueWarning={showOverdueWarning}
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
            yearOptions={yearOptions}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface DatePickerTriggerProps {
  selectedDate?: DatePicker.ContextualDate;
  label?: string;
  onClick: () => void;
  className?: string;
  readonly?: boolean;
  showOverdueWarning: boolean;
}

function DatePickerTrigger({
  selectedDate,
  label = "Date",
  onClick,
  className,
  readonly = false,
  showOverdueWarning,
}: DatePickerTriggerProps) {
  const buttonClassName = classNames(
    "bg-surface-base",
    !readonly && "hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20",
    "border border-surface-outline",
    "rounded-lg",
    "flex items-center gap-1.5",
    readonly ? "cursor-default" : "cursor-pointer",
    "px-3 py-1.5",
    "text-sm",
    readonly && "opacity-75",
    className,
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  let displayText = selectedDate?.value || label;
  const isDateOverdue = selectedDate?.date && isOverdue(selectedDate.date);
  const textClassName = classNames("truncate", isDateOverdue && showOverdueWarning && "text-content-error");
  const calendarClassName = classNames("shrink-0", isDateOverdue && showOverdueWarning && "text-content-error");

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={handleClick}
      disabled={readonly}
      aria-readonly={readonly}
    >
      <IconCalendar size={16} className={calendarClassName} />
      <span className={textClassName}>
        {displayText}
      </span>
      {!readonly && <IconChevronDown size={16} className="shrink-0" />}
    </button>
  );
}

interface DatePickerContentProps {
  dateType: DatePicker.DateType;
  setDateType: React.Dispatch<React.SetStateAction<DatePicker.DateType>>;
  selectedDate?: DatePicker.ContextualDate;
  setSelectedDate: React.Dispatch<React.SetStateAction<DatePicker.ContextualDate | undefined>>;
  onDateSelect?: (selectedDate: DatePicker.ContextualDate | undefined) => void;
  onCancel?: () => void;
  yearOptions: number[];
}

function DatePickerContent(props: DatePickerContentProps) {
  const { dateType, setDateType, selectedDate, setSelectedDate, onDateSelect, onCancel, yearOptions } = props;

  return (
    <div className="max-w-md min-w-[300px] p-6 bg-surface-base rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <IconCalendar size={20} />
        Set Date
      </h2>

      <DateTypeSelector dateType={dateType} dateTypes={DATE_TYPES} setDateType={setDateType} />

      {dateType === "day" && (
        <div className="mb-3">
          <InlineCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </div>
      )}

      {dateType === "month" && (
        <MonthSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} visibleYears={yearOptions} />
      )}

      {dateType === "quarter" && (
        <QuarterSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} visibleYears={yearOptions} />
      )}

      {dateType === "year" && (
        <YearSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} years={yearOptions} />
      )}

      <ActionButtons selectedDate={selectedDate} onCancel={onCancel} onSetDeadline={onDateSelect} />
    </div>
  );
}
