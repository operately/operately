import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { GhostButton } from "../Button";
import { IconCalendarEvent } from "../icons";

export interface ScheduleNoticeProps {
  date: Date;
  onEdit: () => void;
  className?: string;
  formattedTimePreferences: FormattedTimePreferences;
}

export function ScheduleNotice({ date, onEdit, className = "", formattedTimePreferences }: ScheduleNoticeProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center justify-between gap-3 bg-surface-dimmed border border-stroke-base p-3 rounded-lg ${className}`}
    >
      <div className="flex items-center gap-3">
        <IconCalendarEvent size={20} className="text-content-dimmed" />
        <span className="text-sm font-medium">
          <Trans
            i18nKey="Will be posted on <date/> at <time/>"
            components={{
              date: <FormattedTime {...formattedTimePreferences} time={date} format="long-date" />,
              time: <FormattedTime {...formattedTimePreferences} time={date} format="time-only" />,
            }}
          />
        </span>
      </div>
      <GhostButton size="sm" onClick={onEdit}>
        {t("Edit")}
      </GhostButton>
    </div>
  );
}
