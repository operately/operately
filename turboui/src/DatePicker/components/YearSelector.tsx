import React from "react";

interface Props {
  years: number[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export function YearSelector({ years, selectedYear, setSelectedYear }: Props) {
  return (
    <div className="mb-3">
      <div className="max-h-48 overflow-y-auto p-2">
        <div className="flex flex-col space-y-1 mx-auto">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 text-center text-sm rounded transition-colors ${
                selectedYear === year ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
