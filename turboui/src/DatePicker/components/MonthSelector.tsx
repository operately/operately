import React from 'react';
import { MonthOption } from '../types';

interface MonthSelectorProps {
  months: MonthOption[];
  selectedPeriod: number;
  setSelectedPeriod: (period: number) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  months,
  selectedPeriod,
  setSelectedPeriod
}) => {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Month
      </label>
      <div className="grid grid-cols-4 gap-2">
        {months.map(month => (
          <button
            key={month.value}
            onClick={() => setSelectedPeriod(month.value)}
            className={`p-2 rounded-lg border text-center transition-colors ${
              selectedPeriod === month.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium text-xs">{month.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthSelector;
