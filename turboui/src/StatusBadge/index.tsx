import { IconCheck, IconCircleFilled, IconX } from "../icons";
import React from "react";
import { BadgeStatus, StatusBadgeProps } from "./types";

export type { BadgeStatus };

export function StatusBadge({ status, hideIcon = false, className = "", style, customLabel }: StatusBadgeProps) {
  const { bgColor, textColor, borderColor, label } = getStatusProperties(status);
  const icon = hideIcon ? null : getStatusIcon(status, textColor);

  return (
    <span
      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${bgColor} ${textColor} border ${borderColor} shadow-sm ${className}`}
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
        bgColor: "bg-callout-success-bg",
        textColor: "text-callout-success-content",
        dotColor: "bg-callout-success-content",
        borderColor: "border-emerald-200",
        label: "On track",
      };
    case "achieved":
      return {
        bgColor: "bg-callout-success-bg",
        textColor: "text-callout-success-content",
        dotColor: "bg-callout-success-content",
        borderColor: "border-emerald-200",
        label: "Achieved",
      };
    case "completed":
      return {
        bgColor: "bg-callout-success-bg",
        textColor: "text-callout-success-content",
        dotColor: "bg-callout-success-content",
        borderColor: "border-emerald-200",
        label: "Completed",
      };
    case "paused":
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-400 dark:bg-gray-400",
        borderColor: "border-gray-200 dark:border-gray-600",
        label: "Paused",
      };
    case "outdated":
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-400 dark:bg-gray-400",
        borderColor: "border-gray-200 dark:border-gray-600",
        label: "Outdated",
      };
    case "caution":
      return {
        bgColor: "bg-amber-50 dark:bg-amber-900/30",
        textColor: "text-amber-800 dark:text-amber-300",
        dotColor: "bg-amber-500 dark:bg-amber-400",
        borderColor: "border-amber-200 dark:border-amber-800",
        label: "Caution",
      };
    case "off_track":
      return {
        bgColor: "bg-red-50 dark:bg-red-900/30",
        textColor: "text-red-700 dark:text-red-300",
        dotColor: "bg-red-500 dark:bg-red-400",
        borderColor: "border-red-200 dark:border-red-800",
        label: "Off track",
      };
    case "missed":
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
    case "achieved":
      return <IconCheck size={10} className={`${textColor} mr-1.5 flex-shrink-0`} />;

    case "missed":
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

    default:
      return <IconCircleFilled size={8} className={`${textColor} mr-1.5 flex-shrink-0`} />;
  }
};
