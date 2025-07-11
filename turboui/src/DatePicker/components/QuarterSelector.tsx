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
      <div className="grid grid-cols-2 gap-2">
        {quarters.map(quarter => (
          <button
            key={quarter.value}
            onClick={() => setSelectedPeriod(quarter.value)}
            className={`p-2 rounded-lg border text-left transition-colors ${
              selectedPeriod === quarter.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium text-xs">{quarter.label}</div>
            <div className="text-xs text-gray-500">{quarter.range}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuarterSelector;
