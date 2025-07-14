import React, { useRef, useLayoutEffect } from "react";
import { generateQuarters } from "../utils";
import { OptionButton } from "./OptionButton";

interface Props {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  visibleYears: number[];
}

export function QuarterSelector({ selectedDate, setSelectedDate, visibleYears }: Props) {
  const currentYear = new Date().getFullYear();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    setSelectedDate(undefined);
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

  return (
    <div className="mb-3">
      <div ref={containerRef} className="max-h-48 overflow-y-auto p-2">
        {visibleYears.map((year) => (
          <div key={year} className="mb-4 last:mb-0">
            <div className="text-xs font-medium text-gray-500 mb-1">{year}</div>
            <div className="flex space-x-1">
              {generateQuarters(year).map((quarter) => (
                <OptionButton
                  key={quarter.value}
                  onClick={() => setSelectedDate(new Date(quarter.value))}
                  isSelected={isSelectedQuarter(selectedDate, quarter.value, year)}
                  className="flex-1 py-1 px-2 text-xs"
                >
                  {quarter.label}
                </OptionButton>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isSelectedQuarter(date: Date | undefined, quarterValue: string, year: number): boolean {
  try {
    if (!date) return false;

    const quarterDate = new Date(quarterValue);

    // Check if date is in the same quarter
    const dateQuarter = Math.floor(date.getMonth() / 3) + 1;
    const quarterValueQuarter = Math.floor(quarterDate.getMonth() / 3) + 1;

    return (
      date.getFullYear() === year &&
      date.getFullYear() === quarterDate.getFullYear() &&
      dateQuarter === quarterValueQuarter
    );
  } catch {
    return false;
  }
}
