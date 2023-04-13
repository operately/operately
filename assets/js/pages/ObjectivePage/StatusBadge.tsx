import React from "react";
import { useTranslation } from "react-i18next";

const StatusBadgeClasses = {
  "pending": "bg-gray-200 text-gray-800",
  "on_track": "bg-green-200 text-green-800",
  "at_risk": "bg-yellow-200 text-yellow-800",
  "off_track": "bg-red-200 text-red-800",
  "completed": "bg-green-200 text-green-800",
  "cancelled": "bg-gray-200 text-gray-800",
}

export default function StatusBadge({status}: {status: string}) {
  const { t } = useTranslation();

  const colorClasses = StatusBadgeClasses[status]
  if(colorClasses === undefined) {
    throw new Error("Invalid status: " + status);
  }

  return (
    <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-sm " + colorClasses}>
      {t("keyResults.statuses." + status)}
    </span>
  );
}
