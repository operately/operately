import React from "react";

interface DatePreviewProps {
  computedDate: string;
}

export function DatePreview({ computedDate }: DatePreviewProps) {
  if (!computedDate) return null;

  const formatDisplayDate = () => {
    const date = new Date(computedDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-sm font-semibold text-gray-900">{formatDisplayDate()}</div>
    </div>
  );
}
