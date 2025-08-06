import React, { useRef, useLayoutEffect } from "react";
import { generateMonths } from "../utils";
import { OptionButton } from "./OptionButton";
import { DateField } from "../index";

interface Props {
  selectedDate: DateField.ContextualDate | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<DateField.ContextualDate>>;
  visibleYears: number[];
  useStartOfPeriod: boolean;
  minDateLimit?: Date;
  maxDateLimit?: Date;
}

export function MonthSelector({
  selectedDate,
  setSelectedDate,
  visibleYears,
  useStartOfPeriod,
  minDateLimit,
  maxDateLimit,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentYearIndex = visibleYears.indexOf(currentYear);

    if (currentYearIndex !== -1 && containerRef.current) {
      const totalYears = visibleYears.length;

      // Calculate the scroll percentage (0 to 1) where current year should be positioned
      // For example, if 2025 is the middle year in 2020-2030 range, percentage would be ~0.5
      const scrollPercentage = currentYearIndex / (totalYears - 1);

      // Get scrollable height
      const scrollHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight;

      containerRef.current.scrollTop = scrollHeight * scrollPercentage;
    }
  }, []);

  const handleSelect = (month: DateField.PeriodOption) => {
    const date = new Date(month.value);
    const value = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(date);
    setSelectedDate({ date, dateType: "month", value });
  };

  return (
    <div className="mb-3">
      <div ref={containerRef} className="max-h-48 overflow-y-auto p-2">
        {visibleYears.map((year) => (
          <div key={year} className="mb-4 last:mb-0">
            <div className="text-xs font-medium text-gray-500 mb-1">{year}</div>
            <div className="grid grid-cols-4 gap-1">
              {generateMonths(year, useStartOfPeriod).map((month) => {
                const monthDate = new Date(month.value);
                // Check if month is disabled (outside of min/max range)
                const isDisabled = isMonthDisabled(monthDate, minDateLimit, maxDateLimit);

                return (
                  <OptionButton
                    key={month.value}
                    onClick={() => !isDisabled && handleSelect(month)}
                    isSelected={isSelectedMonth(month.value, year, selectedDate)}
                    isCurrent={isCurrentMonth(month.value, year)}
                    isDisabled={isDisabled}
                    className="py-1 px-2 text-xs"
                  >
                    {month.label}
                  </OptionButton>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isSelectedMonth(monthValue: string, year: number, selectedDate: DateField.ContextualDate | null) {
  return Boolean(
    selectedDate &&
      selectedDate.dateType === "month" &&
      selectedDate.date?.getMonth() === new Date(monthValue).getMonth() &&
      selectedDate.date?.getFullYear() === year,
  );
}

function isCurrentMonth(monthValue: string, year: number) {
  const monthDate = new Date(monthValue);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  return monthDate.getMonth() === currentMonth && year === currentYear;
}

function isMonthDisabled(monthDate: Date, minDateLimit?: Date, maxDateLimit?: Date): boolean {
  if (minDateLimit && compareMonthsOnly(monthDate, minDateLimit) < 0) {
    return true;
  }

  if (maxDateLimit && compareMonthsOnly(monthDate, maxDateLimit) > 0) {
    return true;
  }

  return false;
}

/**
 * Compares two dates by month and year only
 * Returns:
 * -1 if date1's month/year is before date2's month/year
 *  0 if date1's month/year is the same as date2's month/year
 *  1 if date1's month/year is after date2's month/year
 */
function compareMonthsOnly(date1: Date, date2: Date): number {
  // Compare years first
  if (date1.getFullYear() !== date2.getFullYear()) {
    return date1.getFullYear() < date2.getFullYear() ? -1 : 1;
  }

  // If years are the same, compare months
  if (date1.getMonth() !== date2.getMonth()) {
    return date1.getMonth() < date2.getMonth() ? -1 : 1;
  }

  // If both year and month are the same
  return 0;
}
