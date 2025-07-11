import React, { useState } from "react";
import { IconCalendar } from "../icons";
import { DateType } from "./types";
import InlineCalendar from "./components/InlineCalendar";
import DateTypeSelector from "./components/DateTypeSelector";
import YearSelector from "./components/YearSelector";
import MonthSelector from "./components/MonthSelector";
import QuarterSelector from "./components/QuarterSelector";
import DatePreview from "./components/DatePreview";
import ActionButtons from "./components/ActionButtons";

const DATE_TYPES = [
  { value: "exact" as const, label: "Exact Date" },
  { value: "month" as const, label: "Month" },
  { value: "quarter" as const, label: "Quarter" },
  { value: "year" as const, label: "Year" },
];

const QUARTERS = [
  { value: 1, label: "Q1", range: "Jan 01 - Mar 31" },
  { value: 2, label: "Q2", range: "Apr 01 - Jun 30" },
  { value: 3, label: "Q3", range: "Jul 01 - Sep 30" },
  { value: 4, label: "Q4", range: "Oct 01 - Dec 31" },
];
const MONTHS = [
  { value: 1, label: "Jan", name: "January" },
  { value: 2, label: "Feb", name: "February" },
  { value: 3, label: "Mar", name: "March" },
  { value: 4, label: "Apr", name: "April" },
  { value: 5, label: "May", name: "May" },
  { value: 6, label: "Jun", name: "June" },
  { value: 7, label: "Jul", name: "July" },
  { value: 8, label: "Aug", name: "August" },
  { value: 9, label: "Sep", name: "September" },
  { value: 10, label: "Oct", name: "October" },
  { value: 11, label: "Nov", name: "November" },
  { value: 12, label: "Dec", name: "December" },
];

export interface DatePickerProps {
  onDateSelect?: (date: string) => void;
  onCancel?: () => void;
  initialDateType?: DateType;
  initialSelectedDate?: string;
  initialSelectedYear?: number;
  initialSelectedPeriod?: number;
  label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  onDateSelect,
  onCancel,
  initialDateType = "exact",
  initialSelectedDate = "",
  initialSelectedYear = new Date().getFullYear(),
  initialSelectedPeriod = 1,
  label = "Date",
}) => {
  const [dateType, setDateType] = useState<DateType>(initialDateType);
  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
  const [selectedYear, setSelectedYear] = useState<number>(initialSelectedYear);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(initialSelectedPeriod);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  const getComputedDate = (): string => {
    switch (dateType) {
      case "exact":
        return selectedDate;
      case "month": {
        const month = selectedPeriod;
        const lastDay = new Date(selectedYear, month, 0).getDate();
        return `${selectedYear}-${month.toString().padStart(2, "0")}-${lastDay}`;
      }
      case "quarter": {
        const quarterEndDates = ["03-31", "06-30", "09-30", "12-31"];
        return `${selectedYear}-${quarterEndDates[selectedPeriod - 1]}`;
      }
      case "year":
        return `${selectedYear}-12-31`;
      default:
        return "";
    }
  };

  const handleSetDeadline = () => {
    const computedDate = getComputedDate();
    if (computedDate && onDateSelect) {
      onDateSelect(computedDate);
    }
  };

  const computedDate = getComputedDate();

  return (
    <div className="max-w-md min-w-[300px] mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <IconCalendar size={20} />
        Set {label}
      </h2>

      {/* Date Type Selection */}
      <DateTypeSelector dateType={dateType} dateTypes={DATE_TYPES} setDateType={setDateType} />

      {/* Year Selection (when not exact date) */}
      {dateType !== "exact" && <YearSelector selectedYear={selectedYear} setSelectedYear={setSelectedYear} />}

      {/* Conditional inputs based on date type */}
      {dateType === "exact" && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Select Date</label>
          <InlineCalendar
            calendarDate={calendarDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setCalendarDate={setCalendarDate}
          />
        </div>
      )}

      {dateType === "month" && (
        <MonthSelector months={MONTHS} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
      )}

      {dateType === "quarter" && (
        <QuarterSelector quarters={QUARTERS} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
      )}
      {/* Preview */}
      {computedDate && <DatePreview computedDate={computedDate} label={label} />}

      {/* Actions */}
      <ActionButtons computedDate={computedDate} onCancel={onCancel} onSetDeadline={handleSetDeadline} />
    </div>
  );
};
