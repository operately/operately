import React from "react";

interface Props {
  years: number[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export function YearSelector({ years, selectedYear, setSelectedYear }: Props) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">Year</label>
      <div className="max-h-48 overflow-y-auto py-1">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`w-full px-3 py-1.5 text-center text-sm transition-colors ${
              selectedYear === year ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50"
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
