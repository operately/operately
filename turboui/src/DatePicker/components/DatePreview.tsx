import React from 'react';

interface DatePreviewProps {
  computedDate: string;
  label: string;
}

export const DatePreview: React.FC<DatePreviewProps> = ({ computedDate, label }) => {
  if (!computedDate) return null;

  const formatDisplayDate = () => {
    const date = new Date(computedDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-xs text-gray-600 mb-1">{label} will be set to:</div>
      <div className="text-sm font-semibold text-gray-900">{formatDisplayDate()}</div>
    </div>
  );
};

export default DatePreview;
