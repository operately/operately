import React from 'react';
import { DateType, DateTypeOption } from '../types';
import { IconChevronDown } from '../../icons';

interface DateTypeSelectorProps {
  dateType: DateType;
  dateTypes: DateTypeOption[];
  setDateType: (type: DateType) => void;
}

export const DateTypeSelector: React.FC<DateTypeSelectorProps> = ({
  dateType,
  dateTypes,
  setDateType
}) => {
  const handleDateTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateType(e.target.value as DateType);
  };

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Date Type
      </label>
      <div className="relative">
        <select
          value={dateType}
          onChange={handleDateTypeChange}
          className="w-full p-2 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {dateTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <IconChevronDown size={16} stroke={1.5} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default DateTypeSelector;
