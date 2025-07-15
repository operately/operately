import React, { useRef, useLayoutEffect } from "react";
import { generateQuarters } from "../utils";
import { OptionButton } from "./OptionButton";
import { SelectedDate } from "../types";

interface Props {
  selectedDate: SelectedDate;
  setSelectedDate: React.Dispatch<React.SetStateAction<SelectedDate>>;
  visibleYears: number[];
}

export function QuarterSelector({ selectedDate, setSelectedDate, visibleYears }: Props) {
  const currentYear = new Date().getFullYear();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
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
                  onClick={() => {
                    setSelectedDate({ type: "quarter", date: new Date(quarter.value) });
                  }}
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

function isSelectedQuarter(selectedDate: SelectedDate, quarterValue: string, year: number): boolean {
  try {
    if (!selectedDate.date) return false;

    const quarterDate = new Date(quarterValue);
    const quarter = Math.floor(selectedDate.date.getMonth() / 3) + 1;
    const selectedQuarter = Math.floor(quarterDate.getMonth() / 3) + 1;

    return selectedDate.type === "quarter" && selectedDate.date.getFullYear() === year && quarter === selectedQuarter;
  } catch {
    return false;
  }
}
