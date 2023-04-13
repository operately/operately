import React from "react";
import { useTranslation } from "react-i18next";

export default function StatusBadge({status}: {status: string}) {
  const { t } = useTranslation();

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-stone-200 text-stone-800">
      {t("keyResults.statuses." + status)}
    </span>
  );
}
