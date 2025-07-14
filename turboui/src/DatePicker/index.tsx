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

export interface Props {
  onDateSelect?: (date: string) => void;
  onCancel?: () => void;
  initialType?: DateType;
  initialDate?: Date;
  minYear?: number;
  maxYear?: number;
}

export function DatePicker({
  onDateSelect,
  onCancel,
  initialType,
  initialDate,
  minYear = 2020,
  maxYear = 2030,
}: Props) {
  const [dateType, setDateType] = useState<DateType>(initialType || "exact");
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  return (
    <div className="max-w-md min-w-[300px] mx-auto p-6 bg-white rounded-lg shadow-lg">
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

      <DatePreview selectedDate={selectedDate} dateType={dateType} />

      <ActionButtons selectedDate={selectedDate} onCancel={onCancel} onSetDeadline={onDateSelect} />
    </div>
  );
}
