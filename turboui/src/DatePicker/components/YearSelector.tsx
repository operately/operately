import React from 'react';

interface YearSelectorProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  selectedYear,
  setSelectedYear
}) => {
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Year
      </label>
      <input
        type="number"
        value={selectedYear}
        onChange={handleYearChange}
        min="2020"
        max="2030"
        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
};

export default YearSelector;
