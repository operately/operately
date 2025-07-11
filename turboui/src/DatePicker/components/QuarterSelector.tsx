import React from "react";
import { PeriodOption } from "../types";

interface Props {
  quarters: PeriodOption[];
  selectedPeriod: number;
  setSelectedPeriod: (period: number) => void;
  selectedYear: number;
  visibleYears: number[];
}

export function QuarterSelector({ quarters, selectedPeriod, setSelectedPeriod, selectedYear, visibleYears }: Props) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">Quarter</label>
      <div className="max-h-48 overflow-y-auto p-2">
        {visibleYears.map((year) => (
          <div key={year} className="mb-4 last:mb-0">
            <div className="text-xs font-medium text-gray-500 mb-1">{year}</div>
            <div className="flex space-x-1">
              {quarters.map((quarter) => (
                <button
                  key={`${year}-${quarter.value}`}
                  onClick={() => setSelectedPeriod(quarter.value)}
                  className={`flex-1 py-1 px-2 rounded text-center text-xs transition-colors ${
                    selectedYear === year && selectedPeriod === quarter.value
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
