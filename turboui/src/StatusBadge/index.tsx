import React from "react";
import { BadgeStatus, StatusBadgeProps } from "./types";
import {
  IconCircleDashed,
  IconCheck,
  IconCircleFilled,
  IconX,
} from "@tabler/icons-react";

export function StatusBadge({ status, hideIcon = false, className = "", style, customLabel }: StatusBadgeProps) {
  const { bgColor, textColor, borderColor, label } = getStatusProperties(status);
  const icon = hideIcon ? null : getStatusIcon(status, textColor);

  return (
    <span
      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm ${className}`}
      style={style}
    >
      {icon}
      {customLabel || label}
    </span>
  );
}

const getStatusProperties = (status: BadgeStatus) => {
  switch (status) {
    case "on_track":
      return {
        bgColor: "bg-green-50 dark:bg-green-900/30",
        textColor: "text-green-700 dark:text-green-300",
        dotColor: "bg-green-500 dark:bg-green-400",
        borderColor: "border-green-200 dark:border-green-800",
        label: "On track",
      };
    case "completed":
      return {
        bgColor: "bg-green-50 dark:bg-green-900/30",
        textColor: "text-green-700 dark:text-green-300",
        dotColor: "bg-green-500 dark:bg-green-400",
        borderColor: "border-green-200 dark:border-green-800",
        label: "Completed",
      };
    case "achieved":
      return {
        bgColor: "bg-green-50 dark:bg-green-900/30",
        textColor: "text-green-700 dark:text-green-300",
        dotColor: "bg-green-500 dark:bg-green-400",
        borderColor: "border-green-200 dark:border-green-800",
        label: "Achieved",
      };
    case "partial":
      return {
        bgColor: "bg-amber-50 dark:bg-amber-900/30",
        textColor: "text-amber-800 dark:text-amber-300",
        dotColor: "bg-amber-500 dark:bg-amber-400",
        borderColor: "border-amber-200 dark:border-amber-800",
        label: "Partial",
      };
    case "paused":
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-400 dark:bg-gray-400",
        borderColor: "border-gray-200 dark:border-gray-600",
        label: "Paused",
      };
    case "not_started":
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-400 dark:bg-gray-400",
        borderColor: "border-gray-200 dark:border-gray-600",
        label: "Not Started",
      };
    case "canceled":
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-400 dark:bg-gray-400",
        borderColor: "border-gray-200 dark:border-gray-600",
        label: "Canceled",
      };
    case "dropped":
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-400 dark:bg-gray-400",
        borderColor: "border-gray-200 dark:border-gray-600",
        label: "Dropped",
      };
    case "outdated":
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-400 dark:bg-gray-400",
        borderColor: "border-gray-200 dark:border-gray-600",
        label: "Outdated",
      };
    case "concern":
    case "caution":
      return {
        bgColor: "bg-amber-50 dark:bg-amber-900/30",
        textColor: "text-amber-800 dark:text-amber-300",
        dotColor: "bg-amber-500 dark:bg-amber-400",
        borderColor: "border-amber-200 dark:border-amber-800",
        label: "Attention",
      };
    case "issue":
      return {
        bgColor: "bg-red-50 dark:bg-red-900/30",
        textColor: "text-red-700 dark:text-red-300",
        dotColor: "bg-red-500 dark:bg-red-400",
        borderColor: "border-red-200 dark:border-red-800",
        label: "At risk",
      };
    case "missed":
    case "failed":
      return {
        bgColor: "bg-red-50 dark:bg-red-900/30",
        textColor: "text-red-700 dark:text-red-300",
        dotColor: "bg-red-500 dark:bg-red-400",
        borderColor: "border-red-200 dark:border-red-800",
        label: "Missed",
      };
    case "pending":
      return {
        bgColor: "bg-blue-50 dark:bg-blue-900/30",
        textColor: "text-blue-700 dark:text-blue-300",
        dotColor: "bg-blue-500 dark:bg-blue-400",
        borderColor: "border-blue-200 dark:border-blue-800",
        label: "Pending",
      };

    case "in_progress":
      return {
        bgColor: "bg-blue-50 dark:bg-blue-900/30",
        textColor: "text-blue-700 dark:text-blue-300",
        dotColor: "bg-blue-500 dark:bg-blue-400",
        borderColor: "border-blue-200 dark:border-blue-800",
        label: "In progress",
      };

    default:
      return {
        bgColor: "bg-gray-50 dark:bg-gray-700",
        textColor: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-400 dark:bg-gray-400",
        borderColor: "border-gray-200 dark:border-gray-600",
        label: status,
      };
  }
};

const getStatusIcon = (status: BadgeStatus, textColor: string) => {
  switch (status) {
    case "not_started":
      return <IconCircleDashed size={10} className={`${textColor} mr-1.5 flex-shrink-0`} />;

    case "completed":
    case "achieved":
      return <IconCheck size={10} className={`${textColor} mr-1.5 flex-shrink-0`} />;

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
          <path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" stroke="none" />
        </svg>
      );

    case "canceled":
    case "missed":
    case "failed":
    case "dropped":
      return <IconX size={10} className={`${textColor} mr-1.5 flex-shrink-0`} />;

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

    case "in_progress":
      return <IconCircleFilled size={8} className={`${textColor} mr-1.5 flex-shrink-0`} />;

    default:
      return <IconCircleFilled size={8} className={`${textColor} mr-1.5 flex-shrink-0`} />;
  }
};
