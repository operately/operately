import { useTranslation } from "react-i18next";
import React from "react";
import { GoalPage } from ".";

export function Activity(props: GoalPage.State) {
  const { t } = useTranslation();
  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="font-bold text-lg mb-4">{t("Activity")}</div>
      {props.activityFeed}
    </div>
  );
}
