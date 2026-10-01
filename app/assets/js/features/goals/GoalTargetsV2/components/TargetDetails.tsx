import { Trans } from "turboui";
import { useTranslation } from "react-i18next";
import React from "react";
import * as Goals from "@/models/goals";
import { Target } from "../types";

interface TargetDetailsProps {
  target: Target;
}

export function TargetDetails({ target }: TargetDetailsProps) {
  const { t } = useTranslation();
  const progress = Goals.targetProgressPercentage(target, false);
  const { from, to, unit, value } = target;

  const decreasing = (from ?? 0) > (to ?? 0);

  const formatUnit = (value) => {
    return `${value}${unit === "%" ? "%" : ` ${unit}`}`;
  };

  return (
    <div className="text-sm ml-6 rounded-lg my-2">
      <div className="flex items-center gap-2">
        <div className="w-20 font-semibold">{t("Target")}</div>
        <div>
          {decreasing ? (
            <Trans
              i18nKey="From <from>{{from}}</from> down to <to>{{to}}</to>{{unit}}"
              values={{ from: from ?? 0, to: to ?? 0, unit: unit === "%" ? "%" : ` ${unit}` }}
              components={{ from: <span className="font-semibold" />, to: <span className="font-semibold" /> }}
            />
          ) : (
            <Trans
              i18nKey="From <from>{{from}}</from> to <to>{{to}}</to>{{unit}}"
              values={{ from: from ?? 0, to: to ?? 0, unit: unit === "%" ? "%" : ` ${unit}` }}
              components={{ from: <span className="font-semibold" />, to: <span className="font-semibold" /> }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-20 font-semibold">{t("Current")}</div>
        <div>
          {formatUnit(value)} <span className={progress < 0 ? "text-red-500" : ""}>({progress.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}
