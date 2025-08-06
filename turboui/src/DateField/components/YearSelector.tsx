import React, { useRef, useLayoutEffect } from "react";
import { OptionButton } from "./OptionButton";
import { DateField } from "../index";
import { getYearDate } from "../utils";

interface Props {
  selectedDate: DateField.ContextualDate | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<DateField.ContextualDate>>;
  years: number[];
  useStartOfPeriod: boolean;
  minDateLimit?: Date;
  maxDateLimit?: Date;
}

export function YearSelector({
  selectedDate,
  setSelectedDate,
  years,
  useStartOfPeriod,
  minDateLimit,
  maxDateLimit,
}: Props) {
  const currentYear = new Date().getFullYear();
  const currentYearRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const currentYearIndex = years.indexOf(currentYear);

    if (currentYearIndex !== -1 && containerRef.current) {
      const totalYears = years.length;

      // Calculate the scroll percentage (0 to 1) where current year should be positioned
      // For example, if 2025 is the middle year in 2020-2030 range, percentage would be ~0.5
      const scrollPercentage = currentYearIndex / (totalYears - 1);

      // Get scrollable height
      const scrollHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight;

      containerRef.current.scrollTop = scrollHeight * scrollPercentage;
    }
  }, []);

  const handleSelect = (year: number) => {
    const date = getYearDate(year, useStartOfPeriod);
    setSelectedDate({
      dateType: "year",
      date: date,
      value: year.toString(),
    });
  };

  return (
    <div className="mb-3">
      <div ref={containerRef} className="max-h-48 overflow-y-auto p-2">
        <div className="flex flex-col space-y-1 mx-auto">
          {years.map((year) => {
            // Check if year is disabled (outside of min/max range)
            const isDisabled = isYearDisabled(year, minDateLimit, maxDateLimit);

            return (
              <OptionButton
                key={year}
                ref={year === currentYear ? currentYearRef : undefined}
                onClick={() => !isDisabled && handleSelect(year)}
                isSelected={isSelectedYear(year, selectedDate)}
                isCurrent={year === currentYear}
                isDisabled={isDisabled}
                className="px-3 py-1.5 text-sm"
              >
                {year}
              </OptionButton>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function isSelectedYear(year: number, selectedDate: DateField.ContextualDate | null): boolean {
  if (!selectedDate?.date) return false;

  return selectedDate.dateType === "year" && selectedDate.date.getFullYear() === year;
}

function isYearDisabled(year: number, minDateLimit?: Date, maxDateLimit?: Date): boolean {
  const minYear = minDateLimit?.getFullYear();

  if (minYear && year < minYear) {
    return true;
  }

  const maxYear = maxDateLimit?.getFullYear();

  if (maxYear && year > maxYear) {
    return true;
  }

  return false;
}
