import React, { useState } from "react";
import { IconCalendar } from "../icons";
import { DateType } from "./types";
import { InlineCalendar } from "./components/InlineCalendar";
import DateTypeSelector from "./components/DateTypeSelector";
import { MonthSelector } from "./components/MonthSelector";
import { QuarterSelector } from "./components/QuarterSelector";
import { YearSelector } from "./components/YearSelector";
import { DatePreview } from "./components/DatePreview";
import ActionButtons from "./components/ActionButtons";

const DATE_TYPES = [
  { value: "exact" as const, label: "Day" },
  { value: "month" as const, label: "Month" },
  { value: "quarter" as const, label: "Quarter" },
  { value: "year" as const, label: "Year" },
];

const QUARTERS = [
  { value: 1, label: "Q1" },
  { value: 2, label: "Q2" },
  { value: 3, label: "Q3" },
  { value: 4, label: "Q4" },
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

export interface Props {
  onDateSelect?: (date: string) => void;
  onCancel?: () => void;
  initialType?: DateType;
  initialDate?: string;
  initialYear?: number;
  initialPeriod?: number;
  minYear?: number;
  maxYear?: number;
}

export function DatePicker({ 
  onDateSelect, 
  onCancel, 
  initialType, 
  initialDate, 
  initialYear, 
  initialPeriod,
  minYear = 2020,
  maxYear = 2030
}: Props) {
  const [dateType, setDateType] = useState<DateType>(initialType || "exact");
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || "");
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<number>(initialPeriod || 1);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

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
        Set Date
      </h2>

      <DateTypeSelector dateType={dateType} dateTypes={DATE_TYPES} setDateType={setDateType} />

      {dateType === "exact" && (
        <div className="mb-3">
          <InlineCalendar
            calendarDate={calendarDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setCalendarDate={setCalendarDate}
          />
        </div>
      )}

      {dateType === "month" && (
        <MonthSelector
          months={MONTHS}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedYear={selectedYear}
          visibleYears={yearOptions}
        />
      )}

      {dateType === "quarter" && (
        <QuarterSelector
          quarters={QUARTERS}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedYear={selectedYear}
          visibleYears={yearOptions}
        />
      )}

      {dateType === "year" && (
        <YearSelector years={yearOptions} selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
      )}

      {computedDate && <DatePreview computedDate={computedDate} />}

      <ActionButtons computedDate={computedDate} onCancel={onCancel} onSetDeadline={handleSetDeadline} />
    </div>
  );
}
