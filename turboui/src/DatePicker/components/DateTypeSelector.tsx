import React from "react";
import { DateType, DateTypeOption } from "../types";

interface DateTypeSelectorProps {
  dateType: DateType;
  dateTypes: DateTypeOption[];
  setDateType: (type: DateType) => void;
}

export const DateTypeSelector: React.FC<DateTypeSelectorProps> = ({ dateType, dateTypes, setDateType }) => {
  const handleDateTypeChange = (type: DateType) => {
    setDateType(type);
  };

  return (
    <div className="mb-3 border-b border-stroke-dimmed pb-2">
      <label className="block text-xs font-medium text-content-base mb-1.5">Date Type</label>
      <div className="flex overflow-hidden rounded-md bg-surface-base">
        {dateTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => handleDateTypeChange(type.value)}
            className={`
              flex-1 py-1 text-sm transition-colors rounded
              ${dateType === type.value ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50"}
            `}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateTypeSelector;
