import React from "react";
import DatePicker from "react-datepicker";

import { LeftChevron, RightChevron } from "./Chevrons";
import { Timeframe, SetTimeframe } from "@/utils/timeframes";

export function MonthPicker({ timeframe, setTimeframe }: { timeframe: Timeframe; setTimeframe: SetTimeframe }) {
  return (
    <DatePicker
      inline
      selected={timeframe.startDate}
      onChange={(date) => setTimeframe({ ...timeframe, startDate: date, endDate: endOfMonth(date) })}
      calendarClassName="w-full"
      showMonthYearPicker
      renderCustomHeader={Header}
      renderMonthContent={renderMonthContent}
    />
  );
}

function Header({ date, decreaseYear, increaseYear }) {
  return (
    <div className="flex items-center w-full px-1 pb-1 gap-2 font-medium mb-2">
      <LeftChevron onClick={decreaseYear} />
      <div>{date.getFullYear()}</div>
      <RightChevron onClick={increaseYear} />
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
