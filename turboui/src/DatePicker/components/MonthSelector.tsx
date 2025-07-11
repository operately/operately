import React from "react";
import { MonthOption } from "../types";

interface Props {
  months: MonthOption[];
  selectedPeriod: number;
  setSelectedPeriod: (period: number) => void;
  selectedYear: number;
  visibleYears: number[];
}

export function MonthSelector({ months, selectedPeriod, setSelectedPeriod, selectedYear, visibleYears }: Props) {
  return (
    <div className="mb-3">
      <div className="max-h-48 overflow-y-auto p-2">
        {visibleYears.map((year) => (
          <div key={year} className="mb-4 last:mb-0">
            <div className="text-xs font-medium text-gray-500 mb-1">{year}</div>
            <div className="grid grid-cols-4 gap-1">
              {months.map((month) => (
                <button
                  key={`${year}-${month.value}`}
                  onClick={() => {
                    setSelectedPeriod(month.value);
                  }}
                  className={`py-1 px-2 rounded text-center text-xs transition-colors ${
                    selectedYear === year && selectedPeriod === month.value
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
