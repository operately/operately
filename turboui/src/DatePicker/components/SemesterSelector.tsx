import React from 'react';
import { PeriodOption } from '../types';

interface SemesterSelectorProps {
  semesters: PeriodOption[];
  selectedPeriod: number;
  setSelectedPeriod: (period: number) => void;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  semesters,
  selectedPeriod,
  setSelectedPeriod
}) => {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Semester
      </label>
      <div className="space-y-1.5">
        {semesters.map(semester => (
          <button
            key={semester.value}
            onClick={() => setSelectedPeriod(semester.value)}
            className={`w-full p-2 rounded-lg border text-left transition-colors ${
              selectedPeriod === semester.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium text-xs">{semester.label}</div>
            <div className="text-xs text-gray-500">{semester.range}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SemesterSelector;
