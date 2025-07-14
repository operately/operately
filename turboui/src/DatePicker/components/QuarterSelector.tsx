import React from "react";
import { generateQuarters } from "../utils";

interface Props {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date) => void;
  visibleYears: number[];
}

export function QuarterSelector({ selectedDate, setSelectedDate, visibleYears }: Props) {
  return (
    <div className="mb-3">
      <div className="max-h-48 overflow-y-auto p-2">
        {visibleYears.map((year) => (
          <div key={year} className="mb-4 last:mb-0">
            <div className="text-xs font-medium text-gray-500 mb-1">{year}</div>
            <div className="flex space-x-1">
              {generateQuarters(year).map((quarter) => (
                <button
                  key={quarter.value}
                  onClick={() => setSelectedDate(new Date(quarter.value))}
                  className={`flex-1 py-1 px-2 rounded text-center text-xs transition-colors ${
                    isSelectedQuarter(selectedDate, quarter.value, year)
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {quarter.label}
                </button>
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
