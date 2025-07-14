import React from "react";
import { DateType } from "../types";

interface DatePreviewProps {
  selectedDate: Date | undefined;
  dateType: DateType;
}

export function DatePreview({ selectedDate, dateType }: DatePreviewProps) {
  if (!selectedDate) return null;

  const formatDisplayDate = () => {
    switch (dateType) {
      case "exact":
        return selectedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      case "month":
        return selectedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      case "quarter":
        const quarter = Math.floor(selectedDate.getMonth() / 3) + 1;
        return `Q${quarter} ${selectedDate.getFullYear()}`;
      case "year":
        return selectedDate.getFullYear().toString();
      default:
        return selectedDate.toLocaleDateString("en-US");
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-sm font-semibold text-gray-900">{formatDisplayDate()}</div>
    </div>
  );
}
