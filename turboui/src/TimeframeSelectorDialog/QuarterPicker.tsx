import React from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utils/formatting";
import { useCalendarLocale } from "./useCalendarLocale";
import DatePicker from "react-datepicker";

import { LeftChevron, RightChevron } from "./Chevrons";
import { Timeframe } from "../utils/timeframes";

interface Props {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
}

export function QuarterPicker({ timeframe, setTimeframe }: Props) {
  const calendarLocale = useCalendarLocale();

  return (
    <DatePicker
      {...calendarLocale}
      inline
      selected={timeframe.startDate}
      onChange={(date) => setTimeframe({ ...timeframe, startDate: date, endDate: endOfQuarter(date) })}
      calendarClassName="w-full"
      showQuarterYearPicker
      renderQuarterContent={(quarter) => <QuarterContent quarter={Number(quarter)} />}
      renderCustomHeader={(props) => <Header {...props} />}
    />
  );
}

function Header({ date, decreaseYear, increaseYear }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center w-full px-1 pb-1 gap-2 font-medium mb-2">
      <LeftChevron label={t("Previous year")} onClick={decreaseYear} />
      <div>{date.getFullYear()}</div>
      <RightChevron label={t("Next year")} onClick={increaseYear} />
    </div>
  );
}

function QuarterContent({ quarter }: { quarter: number }) {
  const { t, i18n } = useTranslation();
  // These are calendar dates, not instants; the year does not appear in the label.
  const start = formatDate(new Date(2000, (quarter - 1) * 3, 1), i18n.resolvedLanguage, {
    month: "short",
    day: "numeric",
  });
  const end = formatDate(new Date(2000, quarter * 3, 0), i18n.resolvedLanguage, { month: "short", day: "numeric" });

  return (
    <div className="text-left px-4 py-2 flex items-center justify-between">
      <span className="font-medium">{t("Q{{quarter}}", { quarter })}</span>
      <span className="text-xs font-medium">{t("{{start}} – {{end}}", { start, end })}</span>
    </div>
  );
}

function endOfQuarter(date: Date | null): Date | null {
  if (!date) return null;

  const month = date.getMonth();
  const year = date.getFullYear();

  if (month >= 0 && month <= 2) {
    return new Date(year, 2, 31);
  } else if (month >= 3 && month <= 5) {
    return new Date(year, 5, 30);
  } else if (month >= 6 && month <= 8) {
    return new Date(year, 8, 30);
  } else {
    return new Date(year, 11, 31);
  }
}
