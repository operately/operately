import React, { useRef, useLayoutEffect } from "react";
import { OptionButton } from "./OptionButton";
import { SelectedDate } from "../types";

interface Props {
  selectedDate: SelectedDate;
  setSelectedDate: React.Dispatch<React.SetStateAction<SelectedDate>>;
  years: number[];
}

export function YearSelector({ selectedDate, setSelectedDate, years }: Props) {
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

  return (
    <div className="mb-3">
      <div ref={containerRef} className="max-h-48 overflow-y-auto p-2">
        <div className="flex flex-col space-y-1 mx-auto">
          {years.map((year) => (
            <OptionButton
              key={year}
              ref={year === currentYear ? currentYearRef : undefined}
              onClick={() => setSelectedDate({ type: "year", date: new Date(year, 0, 1) })}
              isSelected={selectedDate.type === "year" && selectedDate.date?.getFullYear() === year}
              className="px-3 py-1.5 text-sm"
            >
              {year}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  );
}
