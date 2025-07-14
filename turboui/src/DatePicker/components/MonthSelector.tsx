import React from "react";
import { generateMonths } from "../utils";

interface Props {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date) => void;
  visibleYears: number[];
}

export function MonthSelector({ selectedDate, setSelectedDate, visibleYears }: Props) {
  return (
    <div className="mb-3">
      <div className="max-h-48 overflow-y-auto p-2">
        {visibleYears.map((year) => (
          <div key={year} className="mb-4 last:mb-0">
            <div className="text-xs font-medium text-gray-500 mb-1">{year}</div>
            <div className="grid grid-cols-4 gap-1">
              {generateMonths(year).map((month) => (
                <button
                  key={month.value}
                  onClick={() => {
                    setSelectedDate(new Date(month.value));
                  }}
                  className={`py-1 px-2 rounded text-center text-xs transition-colors ${
                    isSelectedMonth(selectedDate, month.value, year)
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isSelectedMonth(date: Date | undefined, monthValue: string, year: number): boolean {
  try {
    if (!date) return false;

    const monthDate = new Date(monthValue);
    return (
      date.getFullYear() === year &&
      date.getFullYear() === monthDate.getFullYear() &&
      date.getMonth() === monthDate.getMonth()
    );
  } catch {
    return false;
  }
}
