import * as React from "react";
import DatePicker from "react-datepicker";

import { LeftChevron, RightChevron } from "./Chevrons";
import { Timeframe, SetTimeframe } from "@/utils/timeframes";

export function QuarterPicker({ timeframe, setTimeframe }: { timeframe: Timeframe; setTimeframe: SetTimeframe }) {
  return (
    <DatePicker
      inline
      selected={timeframe.startDate}
      onChange={(date) => setTimeframe({ ...timeframe, startDate: date, endDate: endOfQuarter(date) })}
      calendarClassName="w-full"
      showQuarterYearPicker
      renderQuarterContent={renderQuarterContent}
      renderCustomHeader={Header}
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

const RANGES = {
  Q1: ["Jan 1", "Mar 31"],
  Q2: ["Apr 1", "Jun 30"],
  Q3: ["Jul 1", "Sep 30"],
  Q4: ["Oct 1", "Dec 31"],
};

function renderQuarterContent(quarter: string) {
  const range = RANGES["Q" + quarter];

  return (
    <div className="text-left px-4 py-2 flex items-center justify-between">
      <span className="font-medium">Q{quarter}</span>
      <span className="text-xs font-medium">
        {range[0]} &ndash; {range[1]}
      </span>
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
