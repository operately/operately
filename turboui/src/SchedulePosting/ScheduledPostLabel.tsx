import React from "react";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "../StatusBadge";

export function ScheduledPostLabel() {
  const { t } = useTranslation();
  return (
    <StatusBadge status="pending" customLabel={t("Scheduled")} hideIcon className="scale-95 inline-block shrink-0" />
  );
}
