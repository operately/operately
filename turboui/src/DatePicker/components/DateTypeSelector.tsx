import React from "react";
import { DatePicker } from "../index";
import { OptionButton } from "./OptionButton";

interface DateTypeSelectorProps {
  dateType: DatePicker.DateType;
  dateTypes: DatePicker.DateTypeOption[];
  setDateType: (type: DatePicker.DateType) => void;
}

export const DateTypeSelector: React.FC<DateTypeSelectorProps> = ({ dateType, dateTypes, setDateType }) => {
  const handleDateTypeChange = (type: DatePicker.DateType) => {
    setDateType(type);
  };

  return (
    <div className="mb-3 border-b border-stroke-dimmed pb-2">
      <label className="block text-xs font-medium text-content-base mb-1.5">Date Type</label>
      <div className="flex overflow-hidden rounded-md bg-surface-base">
        {dateTypes.map((type) => (
          <OptionButton
            key={type.value}
            onClick={() => handleDateTypeChange(type.value)}
            isSelected={dateType === type.value}
            className="flex-1 py-1 text-sm"
          >
            {type.label}
          </OptionButton>
        ))}
      </div>
    </div>
  );
};

export default DateTypeSelector;
