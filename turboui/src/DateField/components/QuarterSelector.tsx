import React, { useRef, useLayoutEffect } from "react";
import { generateQuarters } from "../utils";
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

export function QuarterSelector({
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

  const handleSelect = (quarter: DateField.PeriodOption) => {
    const date = new Date(quarter.value);
    const quarterLabel = `${quarter.label} ${date.getFullYear()}`;
    setSelectedDate({ dateType: "quarter", date, value: quarterLabel });
  };

  return (
    <div className="mb-3">
      <div ref={containerRef} className="max-h-48 overflow-y-auto p-2">
        {visibleYears.map((year) => (
          <div key={year} className="mb-4 last:mb-0">
            <div className="text-xs font-medium text-gray-500 mb-1">{year}</div>
            <div className="flex space-x-1">
              {generateQuarters(year, useStartOfPeriod).map((quarter) => {
                const quarterDate = new Date(quarter.value);
                // Check if quarter is disabled (outside of min/max range)
                const isDisabled = isQuarterDisabled(quarterDate, minDateLimit, maxDateLimit);

                return (
                  <OptionButton
                    key={quarter.value}
                    onClick={() => !isDisabled && handleSelect(quarter)}
                    isSelected={isSelectedQuarter(quarter.value, year, selectedDate)}
                    isCurrent={isCurrentQuarter(quarter.value, year)}
                    isDisabled={isDisabled}
                    className="flex-1 py-1 px-2 text-xs"
                  >
                    {quarter.label}
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

function isSelectedQuarter(quarterValue: string, year: number, selectedDate: DateField.ContextualDate | null): boolean {
  try {
    if (!selectedDate?.date) return false;

    const quarterDate = new Date(quarterValue);
    const quarter = Math.floor(selectedDate.date.getMonth() / 3) + 1;
    const selectedQuarter = Math.floor(quarterDate.getMonth() / 3) + 1;

    return (
      selectedDate.dateType === "quarter" && quarter === selectedQuarter && selectedDate.date.getFullYear() === year
    );
  } catch (e) {
    return false;
  }
}

function isCurrentQuarter(quarterValue: string, year: number): boolean {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1;

  try {
    const quarterDate = new Date(quarterValue);
    const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
    return quarter === currentQuarter && year === currentYear;
  } catch (e) {
    return false;
  }
}

function isQuarterDisabled(quarterDate: Date, minDateLimit?: Date, maxDateLimit?: Date): boolean {
  if (minDateLimit && compareQuartersOnly(quarterDate, minDateLimit) < 0) {
    return true;
  }

  if (maxDateLimit && compareQuartersOnly(quarterDate, maxDateLimit) > 0) {
    return true;
  }

  return false;
}

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3);
}

/**
 * Compares two dates by quarter and year only
 * Returns:
 * -1 if date1's quarter/year is before date2's quarter/year
 *  0 if date1's quarter/year is the same as date2's quarter/year
 *  1 if date1's quarter/year is after date2's quarter/year
 */
function compareQuartersOnly(date1: Date, date2: Date): number {
  // Compare years first
  if (date1.getFullYear() !== date2.getFullYear()) {
    return date1.getFullYear() < date2.getFullYear() ? -1 : 1;
  }

  // If years are the same, compare quarters
  const quarter1 = getQuarter(date1);
  const quarter2 = getQuarter(date2);

  if (quarter1 !== quarter2) {
    return quarter1 < quarter2 ? -1 : 1;
  }

  // If both year and quarter are the same
  return 0;
}
