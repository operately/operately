import React from 'react';
import { PeriodOption } from '../types';

interface QuarterSelectorProps {
  quarters: PeriodOption[];
  selectedPeriod: number;
  setSelectedPeriod: (period: number) => void;
}

export const QuarterSelector: React.FC<QuarterSelectorProps> = ({
  quarters,
  selectedPeriod,
  setSelectedPeriod
}) => {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Quarter
      </label>
      <div className="flex space-x-2">
        {quarters.map(quarter => (
          <button
            key={quarter.value}
            onClick={() => setSelectedPeriod(quarter.value)}
            className={`px-3 py-1.5 rounded-lg border text-center transition-colors flex-1 ${
              selectedPeriod === quarter.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium text-xs">{quarter.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuarterSelector;
