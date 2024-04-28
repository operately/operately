import * as React from "react";
import DatePicker from "react-datepicker";

import { LeftChevron, RightChevron } from "./Chevrons";
import { Timeframe, SetTimeframe } from "./timeframe";

const YEAR_OPTION_COUNT = 6;

export function YearPicker({ timeframe, setTimeframe }: { timeframe: Timeframe; setTimeframe: SetTimeframe }) {
  return (
    <DatePicker
      inline
      selected={timeframe.startDate}
      onChange={(date) => setTimeframe({ ...timeframe, startDate: date, endDate: endOfMonth(date) })}
      calendarClassName="w-full"
      showYearPicker
      yearItemNumber={YEAR_OPTION_COUNT}
      renderYearContent={renderYearContent}
      renderCustomHeader={Header}
    />
  );
}

function Header({ date, decreaseYear, increaseYear }) {
  const year = date.getFullYear();
  const end = Math.ceil(year / YEAR_OPTION_COUNT) * YEAR_OPTION_COUNT;
  const start = end - (YEAR_OPTION_COUNT - 1);

  return (
    <div className="flex items-center w-full px-1 pb-1 gap-2 font-medium mb-2">
      <LeftChevron onClick={decreaseYear} />
      <div>
        {start} - {end}
      </div>
      <RightChevron onClick={increaseYear} />
    </div>
  );
}

function renderYearContent(year: number) {
  return <div className="text-left px-2 py-2 flex items-center justify-between font-medium">{year}</div>;
}

function endOfMonth(date: Date | null): Date | null {
  if (!date) return null;

  const year = date.getFullYear();
  const month = date.getMonth();

  return new Date(year, month + 1, 0);
}
