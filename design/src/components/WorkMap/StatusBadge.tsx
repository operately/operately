import React from "react";
import type { StatusBadgeProps } from "../../types/workmap";

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  let bgColor: string, textColor: string, dotColor: string, borderColor: string, label: string;

  switch (status) {
    case "on_track":
      bgColor = "bg-green-50 dark:bg-green-900/30";
      textColor = "text-green-700 dark:text-green-300";
      dotColor = "bg-green-500 dark:bg-green-400";
      borderColor = "border-green-200 dark:border-green-800";
      label = "On track";
      break;
    case "completed":
      bgColor = "bg-green-50 dark:bg-green-900/30";
      textColor = "text-green-700 dark:text-green-300";
      dotColor = "bg-green-500 dark:bg-green-400";
      borderColor = "border-green-200 dark:border-green-800";
      label = "Completed";
      break;
    case "achieved":
      bgColor = "bg-green-50 dark:bg-green-900/30";
      textColor = "text-green-700 dark:text-green-300";
      dotColor = "bg-green-500 dark:bg-green-400";
      borderColor = "border-green-200 dark:border-green-800";
      label = "Achieved";
      break;
    case "partial":
      bgColor = "bg-amber-50 dark:bg-amber-900/30";
      textColor = "text-amber-800 dark:text-amber-300";
      dotColor = "bg-amber-500 dark:bg-amber-400";
      borderColor = "border-amber-200 dark:border-amber-800";
      label = "Partial";
      break;
    case "paused":
      bgColor = "bg-gray-100 dark:bg-gray-700";
      textColor = "text-gray-700 dark:text-gray-300";
      dotColor = "bg-gray-400 dark:bg-gray-400";
      borderColor = "border-gray-200 dark:border-gray-600";
      label = "Paused";
      break;
    case "dropped":
      bgColor = "bg-gray-100 dark:bg-gray-700";
      textColor = "text-gray-700 dark:text-gray-300";
      dotColor = "bg-gray-400 dark:bg-gray-400";
      borderColor = "border-gray-200 dark:border-gray-600";
      label = "Dropped";
      break;
    case "caution":
      bgColor = "bg-amber-50 dark:bg-amber-900/30";
      textColor = "text-amber-800 dark:text-amber-300";
      dotColor = "bg-amber-500 dark:bg-amber-400";
      borderColor = "border-amber-200 dark:border-amber-800";
      label = "Attention";
      break;
    case "issue":
      bgColor = "bg-red-50 dark:bg-red-900/30";
      textColor = "text-red-700 dark:text-red-300";
      dotColor = "bg-red-500 dark:bg-red-400";
      borderColor = "border-red-200 dark:border-red-800";
      label = "At risk";
      break;
    case "missed":
      bgColor = "bg-red-50 dark:bg-red-900/30";
      textColor = "text-red-700 dark:text-red-300";
      dotColor = "bg-red-500 dark:bg-red-400";
      borderColor = "border-red-200 dark:border-red-800";
      label = "Missed";
      break;
    case "pending":
      bgColor = "bg-blue-50 dark:bg-blue-900/30";
      textColor = "text-blue-700 dark:text-blue-300";
      dotColor = "bg-blue-500 dark:bg-blue-400";
      borderColor = "border-blue-200 dark:border-blue-800";
      label = "Pending";
      break;
    default:
      bgColor = "bg-gray-50 dark:bg-gray-700";
      textColor = "text-gray-700 dark:text-gray-300";
      dotColor = "bg-gray-400 dark:bg-gray-400";
      borderColor = "border-gray-200 dark:border-gray-600";
      label = status;
  }

  // Determine which icon to show based on status
  const getStatusIcon = (): React.ReactNode => {
    switch (status) {
      case "completed":
      case "achieved":
        return (
          <svg
            className={`w-2.5 h-2.5 ${textColor} mr-1.5 flex-shrink-0`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "partial":
        return (
          <svg
            className={`w-2.5 h-2.5 ${textColor} mr-1.5 flex-shrink-0`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Half-filled circle to represent partial completion */}
            <path
              d="M12 3a9 9 0 0 1 0 18 9 9 0 0 1 0-18Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 3a9 9 0 0 0 0 18"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        );
      case "missed":
      case "dropped":
        return (
          <svg
            className={`w-2.5 h-2.5 ${textColor} mr-1.5 flex-shrink-0`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "paused":
        return (
          <svg
            className={`w-2.5 h-2.5 ${textColor} mr-1.5 flex-shrink-0`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 4h-2v16h2V4zM16 4h-2v16h2V4z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return (
          <span
            className={`w-1.5 h-1.5 ${dotColor} rounded-full mr-1.5 flex-shrink-0`}
          ></span>
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm backdrop-blur-[2px]`}
    >
      {getStatusIcon()}
      {label}
    </span>
  );
}
