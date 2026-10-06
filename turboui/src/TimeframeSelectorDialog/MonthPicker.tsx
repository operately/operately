import React from "react";
import { useTranslation } from "react-i18next";
import { useCalendarLocale } from "./useCalendarLocale";
import DatePicker from "react-datepicker";

import { LeftChevron, RightChevron } from "./Chevrons";
import { Timeframe } from "../utils/timeframes";

interface Props {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
}

export function MonthPicker({ timeframe, setTimeframe }: Props) {
  const calendarLocale = useCalendarLocale();

  return (
    <DatePicker
      {...calendarLocale}
      inline
      selected={timeframe.startDate}
      onChange={(date) => setTimeframe({ ...timeframe, startDate: date, endDate: endOfMonth(date) })}
      calendarClassName="w-full"
      showMonthYearPicker
      renderCustomHeader={(props) => <Header {...props} />}
      renderMonthContent={renderMonthContent}
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

function renderMonthContent(_monthIndex: number, _shortMonthText: string, fullMonthText: string) {
  return <div className="text-left px-2 py-2 flex items-center justify-between font-medium">{fullMonthText}</div>;
}

function endOfMonth(date: Date | null): Date | null {
  if (!date) return null;

  const year = date.getFullYear();
  const month = date.getMonth();

  return new Date(year, month + 1, 0);
}
