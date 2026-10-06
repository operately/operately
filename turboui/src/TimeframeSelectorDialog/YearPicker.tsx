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

const YEAR_OPTION_COUNT = 6;

export function YearPicker({ timeframe, setTimeframe }: Props) {
  const calendarLocale = useCalendarLocale();

  return (
    <DatePicker
      {...calendarLocale}
      inline
      selected={timeframe.startDate}
      onChange={(date) => setTimeframe({ ...timeframe, startDate: date, endDate: endOfYear(date) })}
      calendarClassName="w-full"
      showYearPicker
      yearItemNumber={YEAR_OPTION_COUNT}
      renderYearContent={renderYearContent}
      renderCustomHeader={(props) => <Header {...props} />}
    />
  );
}

function Header({ date, decreaseYear, increaseYear }) {
  const { t } = useTranslation();
  const year = date.getFullYear();
  const end = Math.ceil(year / YEAR_OPTION_COUNT) * YEAR_OPTION_COUNT;
  const start = end - (YEAR_OPTION_COUNT - 1);

  return (
    <div className="flex items-center w-full px-1 pb-1 gap-2 font-medium mb-2">
      <LeftChevron label={t("Previous year")} onClick={decreaseYear} />
      <div>
        {start} - {end}
      </div>
      <RightChevron label={t("Next year")} onClick={increaseYear} />
    </div>
  );
}

function renderYearContent(year: number) {
  return <div className="text-left px-2 py-2 flex items-center justify-between font-medium">{year}</div>;
}

function endOfYear(date: Date | null) {
  if (!date) return null;

  const year = date.getFullYear();

  return new Date(year, 11, 31);
}
