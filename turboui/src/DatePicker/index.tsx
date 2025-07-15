import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { IconCalendar, IconChevronDown } from "../icons";
import { SelectedDate, DateType } from "./types";
import { InlineCalendar } from "./components/InlineCalendar";
import DateTypeSelector from "./components/DateTypeSelector";
import { MonthSelector } from "./components/MonthSelector";
import { QuarterSelector } from "./components/QuarterSelector";
import { YearSelector } from "./components/YearSelector";
import ActionButtons from "./components/ActionButtons";
import classNames from "../utils/classnames";

const DATE_TYPES = [
  { value: "exact" as const, label: "Day" },
  { value: "month" as const, label: "Month" },
  { value: "quarter" as const, label: "Quarter" },
  { value: "year" as const, label: "Year" },
];

export namespace DatePicker {
  export interface Props {
    onDateSelect?: (date: string) => void;
    onCancel?: () => void;
    initialType?: DateType;
    initialDate?: Date;
    minYear?: number;
    maxYear?: number;
    triggerLabel?: string;
  }
}

export function DatePicker({
  onDateSelect,
  onCancel,
  initialType,
  initialDate,
  minYear = 2020,
  maxYear = 2030,
  triggerLabel = "Date",
}: DatePicker.Props) {
  const [open, setOpen] = useState(false);
  const [dateType, setDateType] = useState<DateType>(initialType || "exact");
  const [selectedDate, setSelectedDate] = useState<SelectedDate>({ type: initialType, date: initialDate });

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleTriggerClick = () => {
    setOpen(!open);
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <div>
          <DatePickerTrigger
            selectedDate={selectedDate}
            label={triggerLabel}
            onClick={handleTriggerClick}
          />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="z-50 animate-fadeIn" sideOffset={5} align="start">
          <DatePickerContent
            dateType={dateType}
            selectedDate={selectedDate}
            setDateType={setDateType}
            setSelectedDate={setSelectedDate}
            onDateSelect={onDateSelect}
            onCancel={onCancel}
            yearOptions={yearOptions}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface DatePickerTriggerProps {
  selectedDate: SelectedDate;
  label?: string;
  onClick: () => void;
  className?: string;
}

function DatePickerTrigger({ selectedDate, label = "Date", onClick, className }: DatePickerTriggerProps) {
  const buttonClassName = classNames(
    "bg-surface-base hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20",
    "border border-surface-outline",
    "rounded-lg",
    "flex items-center gap-1.5",
    "cursor-pointer",
    "px-3 py-1.5",
    "text-sm",
    className,
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  // Format the date if available, otherwise use the default label
  let displayText = label;
  const { date, type } = selectedDate;

  if (date && type) {
    switch (type) {
      case "exact":
        // Full date: Jul 14, 2025
        displayText = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(
          date,
        );
        break;
      case "quarter":
        // Quarter and year: Q1 2025, Q3 2025, etc.
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        displayText = `Q${quarter} ${date.getFullYear()}`;
        break;
      case "month":
        // Month abbreviation and year: Jan 2025, Mar 2025, Dec 2025, etc.
        displayText = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(date);
        break;
      case "year":
        // Just the year: 2025, 2026, etc.
        displayText = date.getFullYear().toString();
        break;
      default:
        displayText = label;
    }
  }

  return (
    <button type="button" className={buttonClassName} onClick={handleClick}>
      <IconCalendar size={16} className="shrink-0" />
      <span className="truncate">{displayText}</span>
      <IconChevronDown size={16} className="shrink-0" />
    </button>
  );
}

function DatePickerContent(props: {
  dateType: DateType;
  selectedDate: SelectedDate;
  setDateType: (type: DateType) => void;
  setSelectedDate: (date: SelectedDate) => void;
  onDateSelect?: (date: string) => void;
  onCancel?: () => void;
  yearOptions: number[];
}) {
  const { dateType, selectedDate, setDateType, setSelectedDate, onDateSelect, onCancel, yearOptions } = props;

  return (
    <div className="max-w-md min-w-[300px] p-6 bg-surface-base rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <IconCalendar size={20} />
        Set Date
      </h2>

      <DateTypeSelector dateType={dateType} dateTypes={DATE_TYPES} setDateType={setDateType} />

      {dateType === "exact" && (
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

      <ActionButtons selectedDate={selectedDate.date} onCancel={onCancel} onSetDeadline={onDateSelect} />
    </div>
  );
}
